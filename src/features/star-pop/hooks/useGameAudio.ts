"use client";

import { useCallback, useRef } from "react";

type UseGameAudioOptions = {
  enabled: boolean;
};

type ToneStep = {
  frequency: number;
  duration: number;
  delay?: number;
  gain?: number;
  type?: OscillatorType;
};

export function useGameAudio({ enabled }: UseGameAudioOptions) {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(async () => {
    if (!enabled || typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext ||
      // @ts-expect-error webkit fallback
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!contextRef.current) {
      contextRef.current = new AudioContextClass();
    }

    if (contextRef.current.state === "suspended") {
      await contextRef.current.resume();
    }

    return contextRef.current;
  }, [enabled]);

  const playSequence = useCallback(
    async (steps: ToneStep[]) => {
      const context = await getContext();
      if (!context) {
        return;
      }

      const startTime = context.currentTime + 0.01;

      steps.forEach((step) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const stepStart = startTime + (step.delay ?? 0);
        const stepEnd = stepStart + step.duration;

        oscillator.type = step.type ?? "sine";
        oscillator.frequency.setValueAtTime(step.frequency, stepStart);

        gainNode.gain.setValueAtTime(0.0001, stepStart);
        gainNode.gain.exponentialRampToValueAtTime(step.gain ?? 0.05, stepStart + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, stepEnd);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(stepStart);
        oscillator.stop(stepEnd + 0.01);
      });
    },
    [getContext],
  );

  const playStart = useCallback(() => {
    void playSequence([
      { frequency: 392, duration: 0.08, gain: 0.04, type: "triangle" },
      { frequency: 523.25, duration: 0.1, delay: 0.08, gain: 0.05, type: "triangle" },
    ]);
  }, [playSequence]);

  const playInvalid = useCallback(() => {
    void playSequence([
      { frequency: 220, duration: 0.08, gain: 0.03, type: "sawtooth" },
      { frequency: 196, duration: 0.08, delay: 0.06, gain: 0.025, type: "sawtooth" },
    ]);
  }, [playSequence]);

  const playPop = useCallback(
    (groupSize: number) => {
      const accent = Math.min(groupSize, 8);
      void playSequence([
        {
          frequency: 420 + accent * 18,
          duration: 0.06,
          gain: 0.04,
          type: "triangle",
        },
        {
          frequency: 560 + accent * 20,
          duration: 0.08,
          delay: 0.05,
          gain: 0.05,
          type: "triangle",
        },
      ]);
    },
    [playSequence],
  );

  const playAutoClear = useCallback(() => {
    void playSequence([
      { frequency: 659.25, duration: 0.08, gain: 0.045, type: "triangle" },
      { frequency: 523.25, duration: 0.09, delay: 0.07, gain: 0.045, type: "triangle" },
      { frequency: 392, duration: 0.12, delay: 0.14, gain: 0.05, type: "triangle" },
    ]);
  }, [playSequence]);

  const playResult = useCallback(
    (isNewBest: boolean) => {
      void playSequence(
        isNewBest
          ? [
              { frequency: 523.25, duration: 0.09, gain: 0.05, type: "triangle" },
              { frequency: 659.25, duration: 0.1, delay: 0.07, gain: 0.055, type: "triangle" },
              { frequency: 783.99, duration: 0.14, delay: 0.16, gain: 0.06, type: "triangle" },
            ]
          : [
              { frequency: 392, duration: 0.1, gain: 0.04, type: "triangle" },
              { frequency: 329.63, duration: 0.12, delay: 0.08, gain: 0.04, type: "triangle" },
            ],
      );
    },
    [playSequence],
  );

  return {
    playStart,
    playInvalid,
    playPop,
    playAutoClear,
    playResult,
  };
}
