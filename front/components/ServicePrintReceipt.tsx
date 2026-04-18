'use client'

import React from 'react'

export type ServicePrintReceiptProps = {
  vehicle: any
  tenant: any
  companySettings: any
  lastServiceData: any
  printType: 'sticker' | 'receipt'
  qrCodeDataUrl: string
}

function formatUZS(n: number | undefined | null) {
  return `${(Number(n) || 0).toLocaleString('uz-UZ')} so'm`
}

function formatDateTime(value: any) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('uz-UZ', { dateStyle: 'long', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

/** Qisqaroq sana — chop etishda joy tejash */
function formatDateTimeCompact(value: any) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function employeeLabel(e: any) {
  if (!e) return '—'
  if (typeof e === 'string') return e
  return e.name || e._id || '—'
}

function paymentLabel(status: string) {
  if (status === 'paid') return "To'langan"
  if (status === 'partial') return 'Qisman tolangan'
  return "To'lanmagan"
}

export function ServicePrintReceipt({
  vehicle,
  tenant,
  companySettings,
  lastServiceData,
  printType,
  qrCodeDataUrl
}: ServicePrintReceiptProps) {
  if (!lastServiceData) return null

  const companyName =
    companySettings?.companyName || tenant?.companyName || 'OILER.UZ'
  const companyPhone =
    companySettings?.companyPhone || tenant?.businessPhone || ''
  const companyEmail =
    companySettings?.companyEmail || tenant?.businessEmail || ''
  const companyAddress = companySettings?.companyAddress || tenant?.address || ''

  const isWorkSession =
    Array.isArray(lastServiceData.services) && lastServiceData.services.length > 0

  const customer = vehicle?.customer || lastServiceData?.customer
  const custName = typeof customer === 'object' ? customer?.name : '—'
  const custPhone = typeof customer === 'object' ? customer?.phone : '—'

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 7mm;
            }
            body * {
              visibility: hidden !important;
            }
            .service-print-surface,
            .service-print-surface * {
              visibility: visible !important;
            }
            .service-print-surface {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              min-height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            .service-print-receipt {
              font-size: 9.75pt !important;
              line-height: 1.28 !important;
            }
            .service-print-receipt table th,
            .service-print-receipt table td {
              padding: 3px 6px !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `
        }}
      />

      <div className="service-print-surface hidden print:block">
        {printType === 'sticker' ? (
          <div
            className="mx-auto border-2 border-black text-black"
            style={{ width: '58mm', height: '40mm', padding: '2mm', boxSizing: 'border-box', fontSize: '9px' }}
          >
            <div className="text-center font-bold" style={{ fontSize: '11px' }}>
              {companyName}
            </div>
            <div className="text-center" style={{ fontSize: '8px' }}>
              {companyPhone}
            </div>
            <div className="mt-1 space-y-0.5">
              <div>
                <strong>Hozirgi:</strong> {(lastServiceData.mileage || 0).toLocaleString()} km
              </div>
              {lastServiceData.nextServiceMileage != null && (
                <div>
                  <strong>Keyingi:</strong>{' '}
                  {Number(lastServiceData.nextServiceMileage).toLocaleString()} km
                </div>
              )}
              <div>
                <strong>Sana:</strong>{' '}
                {formatDateTime(lastServiceData.createdAt || lastServiceData.date)}
              </div>
            </div>
            {qrCodeDataUrl && (
              <div className="flex justify-center mt-1">
                <img src={qrCodeDataUrl} alt="QR" style={{ width: 44, height: 44 }} />
              </div>
            )}
          </div>
        ) : (
          <div className="service-print-receipt text-slate-900 text-[11px] leading-snug max-w-[196mm] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-900 pb-2 mb-2 gap-2">
              <div className="min-w-0">
                <div className="text-lg font-bold tracking-tight leading-tight">{companyName}</div>
                <div className="text-slate-600 mt-0.5 space-y-0 text-[10px] leading-tight">
                  {companyPhone && <div>Tel: {companyPhone}</div>}
                  {companyEmail && <div>Email: {companyEmail}</div>}
                  {companyAddress && <div>Manzil: {companyAddress}</div>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Xizmat kvitansiyasi</div>
              </div>
            </div>

            {/* Bitta ixcham blok: mashina, mijoz, sana, probeg */}
            <div className="grid grid-cols-2 print:grid-cols-4 gap-1.5 mb-2">
              <div className="rounded border border-slate-300 p-1.5">
                <div className="text-[9px] font-semibold uppercase text-slate-500 mb-0.5">Mashina</div>
                <div className="font-semibold text-[12px] leading-tight">{vehicle?.plateNumber || '—'}</div>
                <div className="text-slate-700 text-[10px] leading-tight">
                  {vehicle?.brand || ''} {vehicle?.vehicleModel || ''}
                </div>
                {vehicle?.engineType && (
                  <div className="text-slate-600 text-[9px] mt-0.5 leading-tight">Dvigatel: {vehicle.engineType}</div>
                )}
              </div>
              <div className="rounded border border-slate-300 p-1.5">
                <div className="text-[9px] font-semibold uppercase text-slate-500 mb-0.5">Mijoz</div>
                <div className="font-semibold text-[11px] leading-tight">{custName}</div>
                <div className="text-slate-700 text-[10px] leading-tight">{custPhone}</div>
              </div>
              <div className="rounded border border-slate-200 p-1.5">
                <div className="text-[9px] text-slate-500">Sana / vaqt</div>
                <div className="font-medium text-[10px] leading-tight">
                  {formatDateTimeCompact(lastServiceData.createdAt || lastServiceData.date)}
                </div>
              </div>
              <div className="rounded border border-slate-200 p-1.5 space-y-1">
                <div>
                  <div className="text-[9px] text-slate-500">Hozirgi probeg</div>
                  <div className="font-medium text-[10px]">
                    {lastServiceData.mileage != null
                      ? `${Number(lastServiceData.mileage).toLocaleString('uz-UZ')} km`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500">Keyingi xizmat</div>
                  <div className="font-medium text-[10px]">
                    {lastServiceData.nextServiceMileage != null
                      ? `${Number(lastServiceData.nextServiceMileage).toLocaleString('uz-UZ')} km`
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wide border-b border-slate-900 pb-0.5 mb-1">
                Xizmat tarkibi
              </div>

              {isWorkSession ? (
                <div className="space-y-1.5">
                  {lastServiceData.services.map((svc: any, idx: number) => (
                    <div key={idx} className="border border-slate-200 rounded overflow-hidden">
                      <div className="bg-slate-100 px-2 py-1 flex justify-between items-center gap-2">
                        <span className="font-semibold text-[11px] leading-tight min-w-0">
                          {svc.serviceName || `Xizmat ${idx + 1}`}
                        </span>
                        <span className="font-mono text-[11px] shrink-0">{formatUZS(svc.totalPrice)}</span>
                      </div>
                      <div className="px-2 py-1 text-[10px] leading-tight">
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-600">Ish haqi</span>
                          <span>{formatUZS(svc.laborCost)}</span>
                        </div>
                        {svc.employees?.length > 0 && (
                          <div className="mt-0.5 text-[8px] text-slate-500 leading-tight">
                            <span className="font-medium text-slate-600">Xodimlar:</span>{' '}
                            {svc.employees.map((e: any) => employeeLabel(e)).join(', ')}
                          </div>
                        )}
                      </div>
                      {svc.items?.length > 0 && (
                        <table className="w-full text-[10px] border-t border-slate-200">
                          <thead className="bg-slate-50">
                            <tr className="text-left text-slate-600">
                              <th className="px-2 py-0.5">Mahsulot</th>
                              <th className="px-2 py-0.5 w-12">Miqd.</th>
                              <th className="px-2 py-0.5 w-20">Narx</th>
                              <th className="px-2 py-0.5 w-24 text-right">Jami</th>
                            </tr>
                          </thead>
                          <tbody>
                            {svc.items.map((it: any, j: number) => (
                              <tr key={j} className="border-t border-slate-100">
                                <td className="px-2 py-0.5">{it.itemName}</td>
                                <td className="px-2 py-0.5">{it.quantity}</td>
                                <td className="px-2 py-0.5">{formatUZS(it.unitPrice)}</td>
                                <td className="px-2 py-0.5 text-right font-medium">{formatUZS(it.totalPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-[11px] border border-slate-200 rounded overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left px-2 py-1">Tavsif</th>
                      <th className="text-right px-2 py-1 w-28">Summa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lastServiceData.oilProduct ||
                      lastServiceData.oilProductCustomerProvided ||
                      lastServiceData.oilProductCustomerProvidedDetails) && (
                      <tr className="border-t border-slate-200">
                        <td className="px-2 py-1">
                          <div className="font-medium">Moy almashtirish</div>
                          <div className="text-[9px] text-slate-600 leading-tight">
                            {lastServiceData.oilProductCustomerProvided ||
                            lastServiceData.oilProductCustomerProvidedDetails
                              ? lastServiceData.oilProductCustomerProvidedDetails || 'Mijoz moyi'
                              : lastServiceData.oilProduct
                                ? `${lastServiceData.oilProduct.brand || ''} ${lastServiceData.oilProduct.viscosity || ''} ${lastServiceData.oilProduct.apiGrade || ''}`.trim()
                                : lastServiceData.oilProductName || '—'}
                            {lastServiceData.oilQuantityUsed != null &&
                              ` · ${lastServiceData.oilQuantityUsed} L`}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right text-slate-500">—</td>
                      </tr>
                    )}
                    {lastServiceData.oilFilter && (
                      <tr className="border-t border-slate-200">
                        <td className="px-2 py-1">
                          <div className="font-medium">Moy filtri</div>
                          <div className="text-[9px] text-slate-600 leading-tight">
                            {(lastServiceData.oilFilter.brandName || lastServiceData.oilFilter.brand || '') +
                              ' ' +
                              (lastServiceData.oilFilter.partNumber || '')}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right">
                          {lastServiceData.oilFilter.price != null
                            ? formatUZS(lastServiceData.oilFilter.price)
                            : '—'}
                        </td>
                      </tr>
                    )}
                    {lastServiceData.airFilter && (
                      <tr className="border-t border-slate-200">
                        <td className="px-2 py-1">
                          <div className="font-medium">Havo filtri</div>
                          <div className="text-[9px] text-slate-600 leading-tight">
                            {(lastServiceData.airFilter.brandName || lastServiceData.airFilter.brand || '') +
                              ' ' +
                              (lastServiceData.airFilter.partNumber || '')}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right">
                          {lastServiceData.airFilter.price != null
                            ? formatUZS(lastServiceData.airFilter.price)
                            : '—'}
                        </td>
                      </tr>
                    )}
                    {lastServiceData.cabinFilter && (
                      <tr className="border-t border-slate-200">
                        <td className="px-2 py-1">
                          <div className="font-medium">Salon filtri</div>
                          <div className="text-[9px] text-slate-600 leading-tight">
                            {(lastServiceData.cabinFilter.brandName || lastServiceData.cabinFilter.brand || '') +
                              ' ' +
                              (lastServiceData.cabinFilter.partNumber || '')}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right">
                          {lastServiceData.cabinFilter.price != null
                            ? formatUZS(lastServiceData.cabinFilter.price)
                            : '—'}
                        </td>
                      </tr>
                    )}
                    {lastServiceData.fuelFilter && (
                      <tr className="border-t border-slate-200">
                        <td className="px-2 py-1">
                          <div className="font-medium">Yonilg'i filtri</div>
                          <div className="text-[9px] text-slate-600 leading-tight">
                            {(lastServiceData.fuelFilter.brandName || lastServiceData.fuelFilter.brand || '') +
                              ' ' +
                              (lastServiceData.fuelFilter.partNumber || '')}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right">
                          {lastServiceData.fuelFilter.price != null
                            ? formatUZS(lastServiceData.fuelFilter.price)
                            : '—'}
                        </td>
                      </tr>
                    )}
                    {lastServiceData.additionalProducts?.map((ap: any, i: number) => (
                      <tr key={i} className="border-t border-slate-200">
                        <td className="px-2 py-1">
                          <div className="font-medium">Qo&apos;shimcha</div>
                          <div className="text-[9px] text-slate-600 leading-tight">
                            {typeof ap.product === 'object' && ap.product?.name
                              ? ap.product.name
                              : 'Mahsulot'}
                            {ap.quantity != null ? ` × ${ap.quantity}` : ''}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right">{formatUZS(ap.price)}</td>
                      </tr>
                    ))}
                    {lastServiceData.laborCost > 0 && (
                      <tr className="border-t border-slate-200">
                        <td className="px-2 py-1 font-medium">Ish haqi</td>
                        <td className="px-2 py-1 text-right">{formatUZS(lastServiceData.laborCost)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {!isWorkSession && lastServiceData.employees?.length > 0 && (
                <p className="text-[8px] text-slate-500 leading-tight mt-1 px-0.5">
                  <span className="font-semibold text-slate-600">Xodimlar:</span>{' '}
                  {lastServiceData.employees.map((e: any) => employeeLabel(e)).join(', ')}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="rounded border-2 border-slate-900 p-2 mb-2">
              <div className="flex justify-between text-[13px] font-bold leading-tight">
                <span>Jami</span>
                <span>
                  {formatUZS(lastServiceData.totalPrice ?? lastServiceData.price ?? 0)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-slate-200 text-[10px] leading-tight">
                <div className="flex justify-between gap-1">
                  <span className="text-slate-600">To&apos;lov</span>
                  <span className="font-medium">{paymentLabel(lastServiceData.paymentStatus)}</span>
                </div>
                <div className="flex justify-between gap-1">
                  <span className="text-slate-600">To&apos;langan</span>
                  <span className="font-medium">{formatUZS(lastServiceData.amountPaid)}</span>
                </div>
                <div className="flex justify-between gap-1 col-span-2">
                  <span className="text-slate-600">Qoldiq (qarz)</span>
                  <span className="font-medium text-red-700">{formatUZS(lastServiceData.amountDue)}</span>
                </div>
                {lastServiceData.dueDate && (
                  <div className="flex justify-between gap-1 col-span-2 text-slate-600">
                    <span>To&apos;lov muddati</span>
                    <span>{formatDateTimeCompact(lastServiceData.dueDate)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
              <div className="text-[9px] text-slate-500 max-w-[65%] leading-tight">
                Ushbu hujjat xizmat ko&apos;rsatilganligini tasdiqlaydi. Savollar bo&apos;lsa, kompaniya bilan bog&apos;laning.
              </div>
              {qrCodeDataUrl && (
                <div className="text-center shrink-0">
                  <img src={qrCodeDataUrl} alt="QR" className="w-[72px] h-[72px] mx-auto border border-slate-200 rounded" />
                  <div className="text-[8px] text-slate-500 mt-0.5">QR</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-slate-300 pt-2">
              <div>
                <div className="h-7 border-b border-slate-400 mb-0.5" />
                <div className="text-slate-600">Mijoz imzosi</div>
              </div>
              <div>
                <div className="h-7 border-b border-slate-400 mb-0.5" />
                <div className="text-slate-600">Ijrochi / ustaxona</div>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-500 mt-3 leading-tight">
              Rahmat · {companyName}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
