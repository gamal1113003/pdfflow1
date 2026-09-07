"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { site } from "@/lib/site";

/**
 * No message endpoint is connected in this build, so the form composes a
 * pre-filled email rather than pretending to send something.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("support");
  const [message, setMessage] = useState("");
  const [opened, setOpened] = useState(false);

  const valid = name.trim() && email.includes("@") && message.trim().length > 10;

  function submit() {
    const subject = encodeURIComponent(`[${topic}] Message from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
    setOpened(true);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">What is this about?</Label>
          <NativeSelect
            id="topic"
            value={topic}
            onChange={setTopic}
            options={[
              { value: "support", label: "Something is not working" },
              { value: "billing", label: "Plans and billing" },
              { value: "business", label: "Teams and Business plan" },
              { value: "privacy", label: "Privacy and data" },
              { value: "other", label: "Something else" },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="I tried to merge four PDFs and the third one…"
            className="w-full rounded-xl border border-input bg-card px-3.5 py-3 text-[0.95rem] leading-relaxed shadow-subtle transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <Button size="lg" onClick={submit} disabled={!valid} className="w-full sm:w-auto">
          Compose email
        </Button>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {opened ? (
            <span className="inline-flex items-center gap-2 text-success">
              <Check className="size-4" aria-hidden="true" />
              Your email app should have opened with this message ready to send.
            </span>
          ) : (
            "This opens your own email app with the message filled in, so nothing is stored here."
          )}
        </p>
      </div>
    </div>
  );
}
