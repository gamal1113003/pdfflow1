"use client";

import { useMemo, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { DownloadResult } from "@/components/pdf/DownloadResult";
import { ErrorNotice } from "@/components/pdf/Notices";
import { ProcessingProgress } from "@/components/pdf/ProcessingProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { SettingsPanel, WidgetStack } from "@/components/widgets/WidgetShell";
import { toBlob } from "@/lib/pdf/document";
import { downloadBlob } from "@/lib/pdf/download";
import {
  buildInvoicePdf,
  CURRENCIES,
  formatMoney,
  invoiceTotals,
  lineNet,
  lineTax,
  type InvoiceLine,
  type Party,
} from "@/lib/pdf/invoice";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatBytes, uid } from "@/lib/utils";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const emptyParty = (): Party => ({ name: "", address: "", phone: "", email: "", website: "" });
const emptyLine = (): InvoiceLine => ({
  id: uid(),
  description: "",
  quantity: 1,
  price: 0,
  discount: 0,
  tax: 0,
});

export function InvoiceWidget() {
  const { language } = useLanguage();
  const locale = language === "ru" ? "ru" : "en";

  const [seller, setSeller] = useState<Party>(emptyParty);
  const [buyer, setBuyer] = useState<Party>(emptyParty);
  const [number, setNumber] = useState("1");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(() => inDays(30));
  const [currency, setCurrency] = useState("EUR");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [logo, setLogo] = useState<string | undefined>();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const totals = useMemo(() => invoiceTotals(lines), [lines]);
  const money = (value: number) => formatMoney(value, currency, locale);

  function updateLine(id: string, patch: Partial<InvoiceLine>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  async function readLogo(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function run() {
    if (!seller.name.trim()) {
      setError("Add your own name or business name first — the invoice needs a sender.");
      return;
    }
    if (lines.every((line) => !line.description.trim())) {
      setError("Add at least one item.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      setResult(
        await buildInvoicePdf({
          seller,
          buyer,
          number,
          issueDate,
          dueDate,
          currency,
          paymentDetails,
          notes,
          lines,
          logoDataUrl: logo,
          language: locale,
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The invoice could not be created.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    const fileName = `invoice-${number || "1"}.pdf`;
    return (
      <DownloadResult
        title="Your invoice is ready"
        fileName={fileName}
        stats={[
          { label: "Items", value: String(lines.filter((l) => l.description.trim()).length) },
          { label: "Total", value: money(totals.total) },
          { label: "Size", value: formatBytes(result.byteLength) },
        ]}
        note="The invoice is a fixed layout, so the text is not selectable. That is what allows any language — including Cyrillic and Arabic — to print correctly without embedding fonts."
        downloadLabel="Download invoice"
        restartLabel="Create another invoice"
        onDownload={() => downloadBlob(toBlob(result), fileName)}
        onRestart={() => setResult(null)}
      />
    );
  }

  const partyFields = (
    party: Party,
    setParty: (value: Party) => void,
    prefix: string,
    withWebsite: boolean,
  ) => (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>Name or business</Label>
        <Input
          id={`${prefix}-name`}
          value={party.name}
          onChange={(event) => setParty({ ...party, name: event.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-address`}>Address</Label>
        <textarea
          id={`${prefix}-address`}
          rows={2}
          value={party.address}
          onChange={(event) => setParty({ ...party, address: event.target.value })}
          className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-phone`}>Phone</Label>
          <Input
            id={`${prefix}-phone`}
            value={party.phone}
            onChange={(event) => setParty({ ...party, phone: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-email`}>Email</Label>
          <Input
            id={`${prefix}-email`}
            type="email"
            value={party.email}
            onChange={(event) => setParty({ ...party, email: event.target.value })}
          />
        </div>
      </div>
      {withWebsite && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-website`}>Website</Label>
          <Input
            id={`${prefix}-website`}
            value={party.website ?? ""}
            onChange={(event) => setParty({ ...party, website: event.target.value })}
          />
        </div>
      )}
    </div>
  );

  return (
    <WidgetStack>
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsPanel title="From" description="Your details, shown at the top of the invoice.">
          {partyFields(seller, setSeller, "seller", true)}
          <div className="mt-4 space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <input
              id="logo"
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(event) => readLogo(event.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
          </div>
        </SettingsPanel>

        <SettingsPanel title="To" description="Who the invoice is addressed to.">
          {partyFields(buyer, setBuyer, "buyer", false)}
        </SettingsPanel>
      </div>

      <SettingsPanel title="Invoice details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="number">Invoice number</Label>
            <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue">Issue date</Label>
            <Input id="issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Due date</Label>
            <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <NativeSelect
              id="currency"
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map((code) => ({ value: code, label: code }))}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="payment">Payment details</Label>
          <textarea
            id="payment"
            rows={3}
            placeholder={"IBAN: ...\nSWIFT: ..."}
            value={paymentDetails}
            onChange={(event) => setPaymentDetails(event.target.value)}
            className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
      </SettingsPanel>

      <SettingsPanel title="Items">
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.id}
              className="grid items-end gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_70px_100px_70px_70px_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`d-${line.id}`} className="text-xs">
                  Description {index + 1}
                </Label>
                <Input
                  id={`d-${line.id}`}
                  value={line.description}
                  onChange={(e) => updateLine(line.id, { description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`q-${line.id}`} className="text-xs">Qty</Label>
                <Input
                  id={`q-${line.id}`}
                  type="number"
                  min={0}
                  step="any"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`p-${line.id}`} className="text-xs">Price</Label>
                <Input
                  id={`p-${line.id}`}
                  type="number"
                  min={0}
                  step="any"
                  value={line.price}
                  onChange={(e) => updateLine(line.id, { price: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`x-${line.id}`} className="text-xs">Disc %</Label>
                <Input
                  id={`x-${line.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={line.discount}
                  onChange={(e) => updateLine(line.id, { discount: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`t-${line.id}`} className="text-xs">Tax %</Label>
                <Input
                  id={`t-${line.id}`}
                  type="number"
                  min={0}
                  max={100}
                  value={line.tax}
                  onChange={(e) => updateLine(line.id, { tax: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pb-1">
                <span className="min-w-24 text-sm tabular-nums text-muted-foreground">
                  {money(lineNet(line) + lineTax(line))}
                </span>
                <button
                  type="button"
                  onClick={() => setLines((c) => (c.length > 1 ? c.filter((l) => l.id !== line.id) : c))}
                  disabled={lines.length === 1}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive disabled:opacity-30"
                >
                  <span className="sr-only">Remove item {index + 1}</span>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => setLines((current) => [...current, emptyLine()])}
        >
          <Plus aria-hidden="true" />
          Add item
        </Button>

        <dl className="mt-6 ml-auto grid w-full max-w-xs gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{money(totals.net)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd className="tabular-nums">{money(totals.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 font-display text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(totals.total)}</dd>
          </div>
        </dl>
      </SettingsPanel>

      <SettingsPanel title="Notes" description="Payment terms, thanks, anything else.">
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[0.95rem] leading-relaxed shadow-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </SettingsPanel>

      {busy ? (
        <ProcessingProgress label="Creating your invoice" value={null} />
      ) : (
        <Button size="lg" className="w-full sm:w-auto" onClick={run}>
          <FileText aria-hidden="true" />
          Create invoice
        </Button>
      )}

      {error && <ErrorNotice title="Could not create the invoice" message={error} />}
    </WidgetStack>
  );
}
