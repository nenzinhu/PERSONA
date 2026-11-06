"use client";

import { useEffect, useRef, useState } from "react";
import { requestSpeechReview, errorText } from "@/lib/api";
import { MAX_AUDIO_BYTES } from "@/lib/media";
import type { Settings } from "@/lib/types";
import type { SpeechReview } from "@/lib/speech";

interface Props {
  settings: Settings;
  senha: string;
  onDictation?: (text: string) => void;
}

const MAX_RECORDING_MS = 60_000;

export default function SpeechRehearsal({ settings, senha, onDictation }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [goal, setGoal] = useState("");
  const [selfReview, setSelfReview] = useState("");
  const [review, setReview] = useState<SpeechReview | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mountedRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!audio) {
      setAudioUrl("");
      return;
    }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError("");
    setNotice("");
    setAudio(null);
    setReview(null);
    setTranscript("");
    onDictation?.("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Este navegador não oferece gravação de áudio. Tente atualizar o navegador ou digite sua fala para revisar.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"].find((type) =>
        MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => setError("A gravação foi interrompida. Tente gravar novamente.");
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (blob.size) {
          setAudio(blob);
          if (blob.size > MAX_AUDIO_BYTES) {
            setError(
              "A gravação passou de 4 MB. Você ainda pode ouvi-la, mas precisa gravar uma fala mais curta para transcrever.",
            );
          } else {
            setNotice("Gravação mantida somente nesta sessão. Ouça e escolha se quer transcrever.");
          }
        }
        setRecording(false);
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      intervalRef.current = setInterval(() => {
        const next = Date.now() - startedAtRef.current;
        setElapsed(next);
        if (next >= MAX_RECORDING_MS) stopRecording();
      }, 250);
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError("Não consegui acessar o microfone. Confira a permissão do navegador e tente novamente.");
    }
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    else setRecording(false);
  }

  async function transcribe() {
    if (!audio) return;
    if (audio.size > MAX_AUDIO_BYTES) {
      setError("A gravação passou de 4 MB. Grave uma fala mais curta para transcrever.");
      return;
    }
    setTranscribing(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      const extension = audio.type.includes("ogg") ? "ogg" : audio.type.includes("mp4") ? "m4a" : "webm";
      form.append("audio", audio, `ensaio.${extension}`);
      const response = await fetch("/api/transcrever", {
        method: "POST",
        headers: { "x-app-password": senha },
        body: form,
      });
      const data = (await response.json().catch(() => ({}))) as { texto?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não consegui transcrever sua fala.");
      const text = String(data.texto ?? "").trim();
      if (!text) throw new Error("Não encontrei fala nessa gravação. Tente outra vez.");
      if (mountedRef.current) {
        setTranscript(text);
        onDictation?.(text);
      }
      setNotice("Transcrição pronta. O áudio ainda está somente nesta sessão; você pode apagá-lo a qualquer momento.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setTranscribing(false);
    }
  }

  async function reviewSpeech() {
    setReviewing(true);
    setError("");
    setNotice("");
    try {
      setReview(
        await requestSpeechReview({ texto: transcript, objetivo: goal, autoavaliacao: selfReview, settings, senha }),
      );
      setNotice("Revisão pronta. Ela considera somente o texto transcrito e sua autoavaliação.");
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setReviewing(false);
    }
  }

  function discardAudio() {
    setAudio(null);
    setNotice("Áudio apagado desta sessão.");
    setError("");
  }

  const seconds = Math.floor(elapsed / 1000);

  const recorder = (
    <section className={onDictation ? undefined : "composer"} aria-labelledby="speech-heading">
      <div className="panel-heading">
        <span aria-hidden="true">◉</span>
        <h2 id="speech-heading">{onDictation ? "Ditar relato" : "Ensaie falando"}</h2>
        <span className="panel-caption">até 60 segundos</span>
      </div>
      <p className="studio-intro">
        {onDictation
          ? "Grave o relato, ouça e transcreva. Confira os números antes de incluir o texto no informe."
          : "Prepare um pedido, explicação ou limite. Grave, ouça e decida se quer transcrever. O Persona revisa o conteúdo da transcrição, não sua voz."}
      </p>
      <div className="speech-actions">
        {!recording ? (
          <button className="primary" disabled={transcribing} onClick={startRecording}>
            {audio ? "Gravar outra vez" : "Começar gravação"}
          </button>
        ) : (
          <button className="primary" onClick={stopRecording} aria-pressed="true">
            Parar gravação · {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </button>
        )}
        {audioUrl && <audio controls src={audioUrl} aria-label="Ouvir sua gravação" />}
      </div>
      {audio && (
        <div className="row speech-actions">
          <button
            className="act"
            disabled={transcribing || recording || audio.size > MAX_AUDIO_BYTES}
            onClick={transcribe}
          >
            {transcribing ? "Transcrevendo…" : "Transcrever minha fala"}
          </button>
          <button className="act" disabled={transcribing} onClick={discardAudio}>
            Apagar áudio
          </button>
          <small className="muted">{(audio.size / 1024).toFixed(0)} KB · máximo 4 MB</small>
        </div>
      )}
      <p className="privacy-note">
        Ao transcrever, o áudio é enviado ao Groq.{" "}
        {onDictation
          ? "A gravação fica nesta tela até trocar de etapa ou sair da seção."
          : "A revisão opcional envia a transcrição e os campos preenchidos ao provedor escolhido. A gravação fica nesta tela até sair da seção."}
      </p>
      {error && (
        <p className="provider-status error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="provider-status" role="status">
          {notice}
        </p>
      )}
    </section>
  );
  if (onDictation) return recorder;

  return (
    <div className="studio-grid">
      {recorder}
      <section className="studio-side" aria-labelledby="speech-review-heading">
        <div className="panel-heading">
          <span aria-hidden="true">✎</span>
          <h2 id="speech-review-heading">Organize a ideia</h2>
        </div>
        <label className="field">
          <span>O que você quer comunicar?</span>
          <input
            value={goal}
            maxLength={300}
            disabled={reviewing}
            onChange={(event) => {
              setGoal(event.target.value);
              setReview(null);
            }}
            placeholder="Ex.: explicar uma decisão"
          />
        </label>
        <label className="field">
          <span>Sua autoavaliação</span>
          <textarea
            rows={3}
            maxLength={500}
            value={selfReview}
            disabled={reviewing}
            onChange={(event) => {
              setSelfReview(event.target.value);
              setReview(null);
            }}
            placeholder="O que ficou fácil ou difícil de dizer?"
          />
        </label>
        <label className="field">
          <span>Transcrição para revisar</span>
          <textarea
            rows={7}
            maxLength={4000}
            value={transcript}
            disabled={transcribing || reviewing}
            onChange={(event) => {
              setTranscript(event.target.value);
              setReview(null);
            }}
            placeholder="Transcreva uma gravação ou escreva o que você diria."
          />
          <small className="muted">
            Você também pode digitar sua fala. Ao revisar, o objetivo e a autoavaliação acima também serão enviados.
          </small>
        </label>
        <button className="primary" disabled={!transcript.trim() || reviewing} onClick={reviewSpeech}>
          {reviewing ? "Revendo a transcrição…" : "Revisar transcrição"}
        </button>
        {review && (
          <div className="speech-review" aria-live="polite">
            <h3>Ideia principal</h3>
            <p>{review.mensagem}</p>
            <h3>Um ponto para esclarecer</h3>
            <p>{review.clareza}</p>
            <h3>Pergunta para ensaiar</h3>
            <p>{review.pergunta}</p>
          </div>
        )}
      </section>
    </div>
  );
}
