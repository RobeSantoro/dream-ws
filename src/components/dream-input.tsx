

import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic } from "lucide-react";
import { prompt, WorkflowData } from "@/assets/workflow_api";
import { v4 as uuidv4 } from "uuid";
import { throttle, debounce } from "lodash";

// Throttle and debounce intervals
const THROTTLE_DELAY = 1000;
const DEBOUNCE_DELAY = 1000;

export function DreamInput() {
  const [dream, setDream] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const promptTemplate = prompt;

  const wsAddress = import.meta.env.VITE_COMFY_WS;
  const clientId = useRef<string>(uuidv4()).current;

  console.log(wsAddress);

  const initializeWebSocket = () => {
    ws.current = new WebSocket(`${wsAddress}?clientId=${clientId}`);

    ws.current.onopen = () => {
      console.log("WebSocket connection OPEN");
      console.log("CLIENT ID: " + clientId);
    };

    ws.current.onclose = () => {
      console.log("WebSocket connection CLOSE");
    };

    ws.current.onmessage = (message) => {
      if (typeof message.data !== "string") {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log("BLOB MESSAGE:", event.target?.result);
          const arrayBuffer = event.target?.result as ArrayBuffer;

          const imageData = arrayBuffer.slice(8);
          const blob = new Blob([imageData], { type: "image/png" });
          const url = URL.createObjectURL(blob);
          setImageSrc(url);
        };

        reader.onerror = (error) => {
          console.error("ERROR reading BLOB data:", error);
        };

        reader.readAsArrayBuffer(message.data);
      }
    };
  };

  const updatePrompt = (prompt: WorkflowData, newText: string) => {
    try {
      Object.keys(prompt).forEach((key) => {
        if (
          prompt[key].class_type === "CLIPTextEncode" &&
          prompt[key]._meta.title === "positive"
        ) {
          prompt[key].inputs.text = newText;
        }
      });
    } catch (error) {
      console.error("Failed to update prompt:", error);
    }
    return prompt;
  };

  const queuePrompt = useCallback(
    async (prompt: WorkflowData) => {
      const payload = { prompt, client_id: clientId };
      try {
        const response = await fetch("api/prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        console.log("HTTP RES:", data);
      } catch (error) {
        console.error("Failed to queue prompt:", error);
      }
    },
    [clientId]
  );

  const throttledQueuePrompt = useCallback(
    throttle(queuePrompt, THROTTLE_DELAY),
    []
  );

  const debouncedQueuePrompt = useCallback(
    debounce(queuePrompt, DEBOUNCE_DELAY),
    []
  );

  useEffect(() => {
    initializeWebSocket();

    return () => {
      ws.current?.close();
      if (imageSrc) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "it-IT";

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      setDream(transcript);

      const updatedPrompt = updatePrompt(promptTemplate, transcript);
      throttledQueuePrompt(updatedPrompt);
      debouncedQueuePrompt(updatedPrompt); // Ensures request is sent after typing stops
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      recognitionInstance.stop();
      throttledQueuePrompt.cancel();
      debouncedQueuePrompt.cancel();
    };
  }, [promptTemplate, throttledQueuePrompt, debouncedQueuePrompt]);

  const handleSpeechToText = () => {
    if (isRecording) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
    setIsRecording((prev) => !prev);
  };

  const handleChange = (newText: string) => {
    setDream(newText);
    const updatedPrompt = updatePrompt(promptTemplate, newText);
    debouncedQueuePrompt(updatedPrompt);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="mb-6 text-3xl font-bold text-center">
        What are you dreaming about?
      </h1>

      {/* Input */}
      <Card
        className={
          isRecording
            ? "w-full max-w-2xl bg-red-500 "
            : "w-full max-w-2xl bg-white"
        }
      >
        <CardContent className="p-4">
          <div className="relative">
            <Textarea
              placeholder="Type your dream here..."
              value={dream}
              onChange={(e) => handleChange(e.target.value)}
              className="min-h-[200px] pr-10 bg-white"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={handleSpeechToText}
            >
              {isRecording ? (
                <Mic className="w-6 h-6 text-red-500" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
              <span className="sr-only">
                {isRecording ? "Stop recording" : "Start recording"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image */}
      <Card>
        <CardContent className="p-4">
          {imageSrc && (
            <div className="mt-6">
              <img
                src={imageSrc}
                alt="Generated Dream"
                className="h-auto max-w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}