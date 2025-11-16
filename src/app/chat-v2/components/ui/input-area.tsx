"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getChatStyles } from "../../lib/theme-utils";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff } from "lucide-react";

// Web Speech API type definitions
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type InputFieldAppearance = "surface" | "glass";

interface InputFieldProps
  extends Omit<React.HTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showCharCount?: boolean;
  appearance?: InputFieldAppearance;
  className?: string;
}

interface InputAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  onSendMessage: (message: string) => void;
  onVoiceInput?: (transcript: string) => void;
  disabled?: boolean;
  placeholder?: string;
  prefillValue?: string | null;
  onPrefillConsumed?: () => void;
  variant?: "surface" | "floating";
  className?: string;
}

/**
 * Enhanced Input Field Component
 *
 * A theme-aware textarea that adapts to the existing design system
 * with proper accessibility and keyboard handling
 */
export function InputField({
  value,
  onChange,
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 2000,
  showCharCount = false,
  appearance = "surface",
  className,
  ...props
}: InputFieldProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const styles = getChatStyles();
  const charCount = value.length;
  const isNearLimit = maxLength && charCount > maxLength * 0.8;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSendMessage();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  const handleFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  };

  const appearanceClasses = {
    surface: cn(
      "bg-background text-foreground placeholder:text-muted-foreground",
      "border-2 border-border focus:border-primary"
    ),
    glass: cn(
      "bg-white/5 text-white placeholder:text-white/60",
      "border border-white/20 focus:border-white/60",
      "shadow-[0_10px_40px_rgba(15,23,42,0.35)]"
    ),
  };

  const sharedStyle = appearance === "surface" ? styles.inputField : "";

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={cn(
          "w-full resize-none rounded-2xl sm:rounded-3xl focus:ring-2 focus:ring-primary/20",
          "px-4 py-2.5 sm:px-5 sm:py-3 text-sm leading-relaxed",
          "transition-all duration-300 ease-in-out",
          "focus:outline-none focus:shadow-lg focus:shadow-primary/10",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "pr-14 sm:pr-16",
          showCharCount && "pb-8",
          appearanceClasses[appearance],
          appearance === "glass" && "rounded-full backdrop-blur",
          sharedStyle,
          className
        )}
        style={{
          minHeight: appearance === "glass" ? "56px" : "48px",
          maxHeight: "140px",
          lineHeight: "1.5",
        }}
        aria-label="Message input"
        {...props}
      />

      {showCharCount && (
        <div
          className={cn(
            "absolute bottom-2 left-4 sm:left-5 text-[0.65rem] sm:text-xs transition-colors duration-200",
            isNearLimit
              ? "text-orange-600 dark:text-orange-400 font-medium"
              : "text-muted-foreground"
          )}
        >
          {charCount}/{maxLength}
        </div>
      )}

      {value.trim() && !disabled && (
        <Button
          type="button"
          size="icon"
          onClick={onSendMessage}
          className={cn(
            "absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 h-11 w-11 sm:h-10 sm:w-10",
            "transition-all duration-200 ease-in-out",
            "shadow-md hover:shadow-lg hover:scale-105 active:scale-95",
            "rounded-full",
            "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
            appearance === "glass"
              ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Enhanced Input Area Component
 *
 * A theme-aware input area that integrates with the existing design system
 * and provides voice input capabilities
 */
export function InputArea({
  onSendMessage,
  onVoiceInput,
  disabled = false,
  placeholder = "Type your message or press voice input...",
  prefillValue,
  onPrefillConsumed,
  variant = "surface",
  className,
  ...props
}: InputAreaProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [isListening, setIsListening] = React.useState(false);

  React.useEffect(() => {
    if (typeof prefillValue === "string") {
      setInputValue(prefillValue);
      onPrefillConsumed?.();
    }
  }, [prefillValue, onPrefillConsumed]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleVoiceInput = () => {
    if (disabled) return;
    if (typeof window === "undefined") {
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognitionClass =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn("Speech Recognition not supported");
      return;
    }

    setIsListening(true);

    const recognition: SpeechRecognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const primaryResult = event.results[0];
      const transcript =
        primaryResult && primaryResult[0] ? primaryResult[0].transcript : "";
      if (!transcript) {
        setIsListening(false);
        return;
      }
      setInputValue(transcript);
      if (onVoiceInput) {
        onVoiceInput(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const styles = getChatStyles();

  const containerClasses =
    variant === "floating"
      ? cn(
          "p-4 sm:p-5 rounded-[32px] border border-white/10",
          "bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/80",
          "backdrop-blur-2xl shadow-[0_25px_80px_rgba(15,23,42,0.55)]"
        )
      : cn("p-4 border-t", styles.inputContainer);

  return (
    <div className={cn(containerClasses, className)} {...props}>
      <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
        {onVoiceInput && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleVoiceInput}
            disabled={disabled}
            className={cn(
              "flex-shrink-0 h-11 w-11 sm:h-10 sm:w-10",
              "transition-all duration-200 hover:scale-105 active:scale-95",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              variant === "floating" &&
                "rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/40",
              variant !== "floating" && "rounded-full hover:border-primary/40",
              isListening && "animate-pulse bg-red-500/20 text-red-700 border-red-400/40"
            )}
            aria-label={isListening ? "Recording voice input" : "Start voice input"}
          >
            {isListening ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </Button>
        )}

        <InputField
          value={inputValue}
          onChange={setInputValue}
          onSendMessage={handleSendMessage}
          disabled={disabled}
          placeholder={placeholder}
          appearance={variant === "floating" ? "glass" : "surface"}
          className="flex-1"
        />
      </div>
    </div>
  );
}
