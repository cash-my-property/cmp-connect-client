import React, { useState, useMemo } from 'react';
import { initialInvoices } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Download,
  CreditCard,
  CheckCircle2,
  X,
  FileText,
  Printer
} from 'lucide-react';

export default function InvoicesPage() {
  const { agency } = useApp();
  const [activeTab, setActiveTab] = useState('to_pay'); // 'to_pay' | 'paid'
  const [searchQuery, setSearchQuery] = useState('');
  const [invoicesData, setInvoicesData] = useState(initialInvoices);

  // Modals
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Filtered by contract search
  const filteredToPay = useMemo(() => {
    if (!searchQuery.trim()) return invoicesData.toPay;
    const q = searchQuery.toLowerCase().trim();
    return invoicesData.toPay.filter(
      (inv) =>
        inv.contractNumber.toLowerCase().includes(q) ||
        inv.paymentNumber.toLowerCase().includes(q)
    );
  }, [invoicesData.toPay, searchQuery]);

  const filteredPaid = useMemo(() => {
    if (!searchQuery.trim()) return invoicesData.paid;
    const q = searchQuery.toLowerCase().trim();
    return invoicesData.paid.filter(
      (inv) =>
        inv.contractNumber.toLowerCase().includes(q) ||
        inv.paymentNumber.toLowerCase().includes(q)
    );
  }, [invoicesData.paid, searchQuery]);

  // Execute Payment
  const handleConfirmPayment = () => {
    if (!payingInvoice) return;
    setPaymentSuccess(true);
    setTimeout(() => {
      // Move invoice from toPay to paid
      const paidItem = {
        ...payingInvoice,
        status: 'Paid',
        canPay: false,
        downloadable: true
      };
      setInvoicesData((prev) => ({
        toPay: prev.toPay.filter(
          (inv) => inv.paymentNumber !== payingInvoice.paymentNumber
        ),
        paid: [paidItem, ...prev.paid]
      }));
      setPaymentSuccess(false);
      setPayingInvoice(null);
    }, 1200);
  };

  return (
    <div>
      {/* Title */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              letterSpacing: '-0.02em'
            }}
          >
            Invoices
          </h1>
        </div>
      </div>

      {/* Contract Search Bar matching concept */}
      <div className="row" style={{ marginBottom: '18px', maxWidth: '360px' }}>
        <label htmlFor="contract-search" className="visually-hidden">
          Search by contract number
        </label>
        <input
          id="contract-search"
          inputMode="numeric"
          placeholder="Search by contract number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ height: '40px', borderRadius: '8px 0 0 8px' }}
        />
        <span
          className="btn btn-outline"
          aria-hidden="true"
          style={{
            height: '40px',
            borderRadius: '0 8px 8px 0',
            borderInlineStart: 'none'
          }}
        >
          <Search size={16} />
        </span>
      </div>

      {/* Segmented Control */}
      <div
        role="tablist"
        aria-label="Invoices"
        className="segmented"
        style={{ marginBottom: '18px' }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'to_pay'}
          onClick={() => setActiveTab('to_pay')}
        >
          To pay ({invoicesData.toPay.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'paid'}
          onClick={() => setActiveTab('paid')}
        >
          Paid ({invoicesData.paid.length})
        </button>
      </div>

      {/* Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Payment #</th>
              <th>Contract #</th>
              <th>Frequency</th>
              <th>Mode</th>
              <th>Due date</th>
              <th>Status</th>
              <th>Amount (AED)</th>
              <th>Invoice</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'to_pay' ? (
              filteredToPay.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                    No pending invoices found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredToPay.map((item) => (
                  <tr key={item.paymentNumber}>
                    <td style={{ whiteSpace: 'nowrap' }}>{item.paymentNumber}</td>
                    <td>{item.contractNumber}</td>
                    <td>{item.frequency}</td>
                    <td>{item.mode}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{item.dueDate}</td>
                    <td>{item.status}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {item.amount}
                    </td>
                    <td>
                      {item.downloadable ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          aria-label={`Download invoice ${item.paymentNumber}`}
                          style={{ width: '40px', padding: 0 }}
                          onClick={() => setPreviewInvoice(item)}
                          title="Download invoice"
                        >
                          <Download size={16} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled
                          title="Available 30 days before the due date"
                          aria-label={`Invoice ${item.paymentNumber} available 30 days before the due date`}
                          style={{ width: '40px', padding: 0, opacity: 0.4 }}
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </td>
                    <td>
                      {item.canPay && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setPayingInvoice(item)}
                        >
                          Pay now
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )
            ) : filteredPaid.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                  No paid invoices found matching "{searchQuery}"
                </td>
              </tr>
            ) : (
              filteredPaid.map((item) => (
                <tr key={item.paymentNumber}>
                  <td style={{ whiteSpace: 'nowrap' }}>{item.paymentNumber}</td>
                  <td>{item.contractNumber}</td>
                  <td>{item.frequency}</td>
                  <td>{item.mode}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{item.dueDate}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: 'var(--cmp-success)',
                        border: '1px solid color-mix(in srgb, var(--cmp-success) 55%, transparent)',
                        background: 'color-mix(in srgb, var(--cmp-success) 10%, transparent)'
                      }}
                    >
                      Paid
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {item.amount}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      aria-label={`Download invoice ${item.paymentNumber}`}
                      style={{ width: '40px', padding: 0 }}
                      onClick={() => setPreviewInvoice(item)}
                      title="Download receipt / invoice"
                    >
                      <Download size={16} />
                    </button>
                  </td>
                  <td>
                    <span className="badge badge-neutral">Settled</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pay Now Modal */}
      {payingInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '20px'
          }}
          onClick={() => !paymentSuccess && setPayingInvoice(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(440px, 100%)',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!paymentSuccess && (
              <button
                type="button"
                className="icon-button"
                style={{ position: 'absolute', top: '14px', right: '14px' }}
                onClick={() => setPayingInvoice(null)}
              >
                <X size={18} />
              </button>
            )}

            {paymentSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'var(--cmp-brand-subtle)',
                    color: 'var(--cmp-brand)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>
                <h3 style={{ fontSize: '19px', marginBottom: '8px' }}>Payment Approved</h3>
                <p className="muted" style={{ fontSize: '14px', margin: 0 }}>
                  AED {payingInvoice.amount} processed successfully. Invoice {payingInvoice.paymentNumber} has been updated to Paid.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '18px', marginBottom: '6px' }}>
                  Pay Invoice {payingInvoice.paymentNumber}
                </h2>
                <p className="muted" style={{ fontSize: '13.5px', margin: '0 0 16px' }}>
                  Contract #{payingInvoice.contractNumber} · Due {payingInvoice.dueDate}
                </p>

                <div
                  style={{
                    background: 'var(--cmp-surface-sunken)',
                    border: '1px solid var(--cmp-border)',
                    borderRadius: 'var(--cmp-radius-md)',
                    padding: '16px',
                    marginBottom: '18px'
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="muted" style={{ fontSize: '13px' }}>Invoice Amount</span>
                    <strong style={{ fontSize: '16px', color: 'var(--cmp-brand)' }}>
                      AED {payingInvoice.amount}
                    </strong>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span className="muted">Payment Method:</span>
                    <span className="row" style={{ gap: '6px' }}>
                      <CreditCard size={14} /> Corporate Visa (•••• 4242)
                    </span>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px' }}>
                    <span className="muted">Billed To:</span>
                    <span>{agency.name}</span>
                  </div>
                </div>

                <div className="row" style={{ gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setPayingInvoice(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleConfirmPayment}
                  >
                    Pay AED {payingInvoice.amount}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '20px'
          }}
          onClick={() => setPreviewInvoice(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(580px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button"
              style={{ position: 'absolute', top: '14px', right: '14px' }}
              onClick={() => setPreviewInvoice(null)}
            >
              <X size={18} />
            </button>

            <div className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '16px', marginBottom: '18px' }}>
              <div>
                <span className="badge badge-brand" style={{ marginBottom: '6px' }}>TAX INVOICE</span>
                <h2 style={{ fontSize: '18px' }}>Cash My Property Portal FZ-LLC</h2>
                <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                  TRN: 100482910400003 · Dubai Internet City, UAE
                </p>
              </div>
              <div style={{ textAlign: 'end' }}>
                <strong style={{ fontSize: '15px' }}>{previewInvoice.paymentNumber}</strong>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                  Date: {previewInvoice.dueDate}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '13px' }}>
              <div>
                <p className="faint" style={{ margin: '0 0 4px', textTransform: 'uppercase', fontSize: '11px' }}>
                  Billed To
                </p>
                <strong>{agency.name}</strong>
                <p className="muted" style={{ margin: '2px 0 0' }}>License: {agency.licenseNumber}</p>
                <p className="muted" style={{ margin: '2px 0 0' }}>{agency.phone}</p>
              </div>
              <div>
                <p className="faint" style={{ margin: '0 0 4px', textTransform: 'uppercase', fontSize: '11px' }}>
                  Contract Details
                </p>
                <p style={{ margin: 0 }}>Contract #: <strong>{previewInvoice.contractNumber}</strong></p>
                <p style={{ margin: '2px 0 0' }}>Frequency: {previewInvoice.frequency}</p>
                <p style={{ margin: '2px 0 0' }}>Status: <strong>{previewInvoice.status}</strong></p>
              </div>
            </div>

            {/* Line items table */}
            <div className="card table-scroll" style={{ marginBottom: '18px' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ textAlign: 'end' }}>Amount (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>CMP Connect Monthly Agency Subscription (Gold Tier)</td>
                    <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>4,694.80</td>
                  </tr>
                  <tr>
                    <td>VAT (5%)</td>
                    <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>234.74</td>
                  </tr>
                  <tr style={{ background: 'var(--cmp-surface-sunken)', fontWeight: 700 }}>
                    <td>Total Due (AED)</td>
                    <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums', color: 'var(--cmp-brand)' }}>
                      {previewInvoice.amount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', gap: '10px' }}>
              <span className="faint" style={{ fontSize: '12px' }}>
                Bank: Emirates NBD · IBAN: AE0702600014895500129
              </span>
              <div className="row" style={{ gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setPreviewInvoice(null)}
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
