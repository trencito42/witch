"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface AddAssertionFormProps {
  siteId: string;
  action: (formData: FormData) => Promise<void>;
  enabled: boolean;
}

export function AddAssertionForm({
  action,
  enabled,
}: AddAssertionFormProps) {
  const [selector, setSelector] = React.useState("");
  const [expectedText, setExpectedText] = React.useState("");
  const [selectorError, setSelectorError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const validateSelector = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setSelectorError(null);
      return false;
    }
    try {
      document.querySelector(trimmed);
      setSelectorError(null);
      return true;
    } catch {
      setSelectorError("That selector is not valid. Use standard CSS selectors like button.checkout or #cta.");
      return false;
    }
  };

  const handleSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelector(val);
    if (val.trim()) {
      validateSelector(val);
    } else {
      setSelectorError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateSelector(selector)) return;

    const formData = new FormData();
    formData.set("selector", selector.trim());
    if (expectedText.trim()) {
      formData.set("expectedText", expectedText.trim());
    }

    startTransition(async () => {
      await action(formData);
      setSelector("");
      setExpectedText("");
      setSelectorError(null);
    });
  };

  if (!enabled) {
    return (
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <h3 className="text-[15px] font-semibold text-[var(--text)]">
          Add DOM Element Assertion
        </h3>
        <p className="text-[13px] text-[var(--text-muted)]">
          Element monitors verify interactive elements inside real Chromium sessions. This feature is available on Freelancer and above.
        </p>
        <Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
          Requires Freelancer Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm space-y-5">
      <div>
        <h3 className="text-[16px] font-semibold text-[var(--text)]">
          Add DOM Element Assertion
        </h3>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          Verify that critical interactive controls (e.g. checkout buttons, sign-up forms, navigation triggers) remain mounted and clickable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CSS Selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="assertion-selector"
            className="block text-[13px] font-medium text-[var(--text)]"
          >
            CSS Selector
          </label>
          <input
            id="assertion-selector"
            name="selector"
            type="text"
            required
            value={selector}
            onChange={handleSelectorChange}
            placeholder="button.checkout, #submit-order, a[data-action='pay']"
            className={`w-full h-11 px-3.5 rounded-lg border font-mono text-[14px] bg-[var(--surface)] text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 ${
              selectorError
                ? "border-[var(--critical)] focus-visible:ring-[var(--critical)]"
                : "border-[var(--border)] focus-visible:ring-[var(--border-focus)]"
            }`}
          />
          {selectorError ? (
            <p className="text-[12px] font-medium text-[var(--critical)] mt-1">
              {selectorError}
            </p>
          ) : (
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Any valid CSS query selector matching the expected target element on the page.
            </p>
          )}
        </div>

        {/* Expected Text */}
        <div className="space-y-1.5">
          <label
            htmlFor="assertion-expectedText"
            className="block text-[13px] font-medium text-[var(--text)]"
          >
            Expected Text Content (optional)
          </label>
          <input
            id="assertion-expectedText"
            name="expectedText"
            type="text"
            value={expectedText}
            onChange={(e) => setExpectedText(e.target.value)}
            placeholder="e.g. Checkout, Place Order, Sign Up"
            className="w-full h-11 px-3.5 rounded-lg border border-[var(--border)] font-sans text-[14px] bg-[var(--surface)] text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          />
          <p className="text-[12px] text-[var(--text-muted)] mt-1">
            If specified, Witch asserts that the matched element contains this exact text string.
          </p>
        </div>

        {/* Submit Button (Full width on mobile) */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={!selector.trim() || Boolean(selectorError) || isPending}
            className="w-full sm:w-auto touch-target"
          >
            {isPending ? "Adding assertion..." : "Add element check"}
          </Button>
        </div>
      </form>
    </div>
  );
}
