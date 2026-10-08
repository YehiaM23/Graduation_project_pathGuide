import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type RemoteTrack,
} from 'livekit-client';
import { Loader2, Phone, Video, VideoOff } from 'lucide-react';
import { mockInterviewApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Parse the `applicationId` query param to a positive integer, or `undefined`
 * if absent / malformed. The .NET endpoint treats this as optional, so we
 * never block the UI on a bad value — we just don't forward it.
 */
function parseApplicationId(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

type Phase = 'idle' | 'connecting' | 'live' | 'ended';

type StartStage = 'token' | 'connect' | 'media';

/**
 * Map a failure at a given startup stage to a message that points at the real
 * cause, instead of always blaming the camera/microphone. `token` failures are
 * almost always a backend/config problem (e.g. the LiveKit section missing from
 * appsettings), `connect` failures are network/URL, and only `media` failures
 * are actually about camera/mic access.
 */
function describeStartError(stage: StartStage, err: unknown): string {
  if (stage === 'token') {
    const serverMessage =
      typeof err === 'object' && err !== null
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
    return (
      serverMessage ??
      'Could not reach the interview service. Please try again, or contact support if it keeps happening.'
    );
  }

  if (stage === 'connect') {
    return 'Could not connect to the interview room. Please check your network connection and try again.';
  }

  const name =
    typeof err === 'object' && err !== null
      ? (err as { name?: string }).name
      : undefined;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera and microphone access was blocked. Please allow access in your browser and try again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera or microphone was found. Please connect a device and try again.';
  }
  return 'Could not start your camera and microphone. Make sure they are available and not in use by another app.';
}

export default function MockInterview() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const applicationId = parseApplicationId(searchParams.get('applicationId'));

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);

  // Always disconnect on unmount so a navigation away doesn't leave a live
  // LiveKit session running in the background.
  useEffect(() => {
    return () => {
      const room = roomRef.current;
      roomRef.current = null;
      if (room) {
        void room.disconnect();
      }
    };
  }, []);

  const attachCameraTrack = (publication: LocalTrackPublication) => {
    if (publication.kind !== Track.Kind.Video || !publication.track) return;
    if (!videoContainerRef.current) return;

    const element = publication.track.attach() as HTMLVideoElement;
    element.autoplay = true;
    element.muted = true;
    element.playsInline = true;
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.objectFit = 'cover';
    element.style.transform = 'scaleX(-1)';
    videoContainerRef.current.replaceChildren(element);
  };

  const attachRemoteAudio = (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    const element = track.attach() as HTMLAudioElement;
    element.dataset.trackSid = track.sid ?? '';
    audioContainerRef.current?.appendChild(element);
  };

  const startInterview = async () => {
    setError(null);
    setPhase('connecting');

    // Track which step we're on so a failure can report the real cause instead
    // of always blaming the camera/microphone.
    let stage: 'token' | 'connect' | 'media' = 'token';

    try {
      const { data } = await mockInterviewApi.issueToken(
        applicationId !== undefined ? { applicationId } : {},
      );

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => attachRemoteAudio(track));
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
      });
      // The camera publication's `.track` is not always populated by the time
      // enableCameraAndMicrophone() resolves — listen for the publish event so
      // we attach reliably regardless of timing.
      room.on(RoomEvent.LocalTrackPublished, (publication) => attachCameraTrack(publication));
      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current === room) {
          roomRef.current = null;
          setPhase('ended');
        }
      });

      stage = 'connect';
      await room.connect(data.url, data.token);

      // Flip to the live phase before publishing tracks so the video container
      // is mounted in the DOM by the time LocalTrackPublished fires.
      setPhase('live');

      stage = 'media';
      await room.localParticipant.enableCameraAndMicrophone();

      // Defensive fallback: if the publish event already fired (cached
      // permission), the publication may be available now. Attaching twice is
      // safe — replaceChildren clears the prior <video> element.
      const cameraPublication = room.localParticipant.getTrackPublication(
        Track.Source.Camera,
      );
      if (cameraPublication) {
        attachCameraTrack(cameraPublication);
      }

      // Browsers block media autoplay unless playback was kicked off inside a
      // user-activation event. Start Interview is a click handler, so this
      // call inherits its activation and lets the agent's TTS audio play.
      // Without it, you can see the local camera but never hear the agent.
      try {
        await room.startAudio();
      } catch (audioErr) {
        console.warn('Could not start audio playback automatically:', audioErr);
      }
    } catch (err) {
      console.error(`Failed to start mock interview (stage: ${stage}):`, err);
      const room = roomRef.current;
      roomRef.current = null;
      if (room) {
        void room.disconnect();
      }
      setError(describeStartError(stage, err));
      setPhase('idle');
    }
  };

  const endInterview = async () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      await room.disconnect();
    }
    setPhase('ended');
  };

  const showRoomUi = phase === 'live' || phase === 'ended';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Video className="h-8 w-8" />
          Mock Interview
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Practice a live AI-driven interview. Allow camera and microphone access when prompted.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 max-w-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {phase === 'idle' && (
        <div className="space-y-4">
          <p className="text-[var(--muted-foreground)] max-w-xl">
            When you start the interview, an AI interviewer will join the room and ask you
            questions across multiple stages. A written report is generated when the
            interview ends.
          </p>
          <Button onClick={startInterview} className="gradient-btn text-white">
            <Video className="h-4 w-4" />
            Start Interview
          </Button>
        </div>
      )}

      {phase === 'connecting' && (
        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Connecting to the interview room…
        </div>
      )}

      {showRoomUi && (
        <div className="space-y-4 max-w-xl">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              phase === 'live'
                ? 'bg-[var(--muted)] text-[var(--foreground)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                phase === 'live'
                  ? 'bg-[var(--secondary)] animate-pulse'
                  : 'bg-[var(--destructive)]'
              }`}
            />
            {phase === 'live' ? 'Connected — interview in progress' : 'Interview ended'}
          </div>

          <div
            ref={videoContainerRef}
            className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-[var(--border)]"
          />

          {phase === 'live' ? (
            <Button onClick={endInterview} variant="destructive">
              <Phone className="h-4 w-4 rotate-[135deg]" />
              End Interview
            </Button>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
              <VideoOff className="h-4 w-4" />
              Your interview report is being generated.
            </p>
          )}
        </div>
      )}

      <div ref={audioContainerRef} className="sr-only" aria-hidden />
    </div>
  );
}
