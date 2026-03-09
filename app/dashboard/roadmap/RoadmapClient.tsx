'use client'

const TRUCK_COUNTS = [1, 2, 5, 10, 15, 20, 25] as const

const REVENUE_PER_TRUCK_DAY = 320
const DRIVER_PAY_WEEK = 600
const FUEL_MAINTENANCE_WEEK = 250
const INSURANCE_WEEK = 100
const ADMIN_SOFTWARE_WEEK = 60

const DAYS_PER_WEEK = 5
const WEEKS_PER_YEAR = 52
const MONTHS_PER_YEAR = 12

const revPerTruckDay = REVENUE_PER_TRUCK_DAY
const revPerTruckWeek = REVENUE_PER_TRUCK_DAY * DAYS_PER_WEEK
const revPerTruckMonth = (revPerTruckWeek * WEEKS_PER_YEAR) / MONTHS_PER_YEAR
const revPerTruckYear = revPerTruckWeek * WEEKS_PER_YEAR

const expPerTruckWeek = DRIVER_PAY_WEEK + FUEL_MAINTENANCE_WEEK + INSURANCE_WEEK + ADMIN_SOFTWARE_WEEK
const expPerTruckDay = expPerTruckWeek / DAYS_PER_WEEK
const expPerTruckMonth = (expPerTruckWeek * WEEKS_PER_YEAR) / MONTHS_PER_YEAR
const expPerTruckYear = expPerTruckWeek * WEEKS_PER_YEAR

const netPerTruckDay = revPerTruckDay - expPerTruckDay
const netPerTruckWeek = revPerTruckWeek - expPerTruckWeek
const netPerTruckMonth = revPerTruckMonth - expPerTruckMonth
const netPerTruckYear = revPerTruckYear - expPerTruckYear

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n)
}

type Row = {
  trucks: number
  revDay: number
  revWeek: number
  revMonth: number
  revYear: number
  expDay: number
  expWeek: number
  expMonth: number
  expYear: number
  netDay: number
  netWeek: number
  netMonth: number
  netYear: number
}

export default function RoadmapClient() {
  const rows: Row[] = TRUCK_COUNTS.map((n) => ({
    trucks: n,
    revDay: revPerTruckDay * n,
    revWeek: revPerTruckWeek * n,
    revMonth: revPerTruckMonth * n,
    revYear: revPerTruckYear * n,
    expDay: expPerTruckDay * n,
    expWeek: expPerTruckWeek * n,
    expMonth: expPerTruckMonth * n,
    expYear: expPerTruckYear * n,
    netDay: netPerTruckDay * n,
    netWeek: netPerTruckWeek * n,
    netMonth: netPerTruckMonth * n,
    netYear: netPerTruckYear * n,
  }))

  const maxNetYear = Math.max(...rows.map((r) => r.netYear))

  return (
    <div className="min-h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 touch-pan-y">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Profit Roadmap</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            1099 delivery fleet — revenue, expenses, and net profit by truck count
          </p>
        </header>

        {/* Assumptions */}
        <section className="mb-6 sm:mb-8 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Assumptions (per truck)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Revenue:</span> <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(REVENUE_PER_TRUCK_DAY)}/day</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Driver (1099):</span> <span className="font-medium">{formatCurrency(DRIVER_PAY_WEEK)}/week</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Fuel & maintenance:</span> <span className="font-medium">{formatCurrency(FUEL_MAINTENANCE_WEEK)}/week</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Insurance:</span> <span className="font-medium">{formatCurrency(INSURANCE_WEEK)}/week</span></div>
            <div className="col-span-2 sm:col-span-1"><span className="text-gray-500 dark:text-gray-400">Admin / software:</span> <span className="font-medium">{formatCurrency(ADMIN_SOFTWARE_WEEK)}/week</span></div>
          </div>
        </section>

        {/* Mobile: cards (one per truck count), vertical scroll only */}
        <section className="md:hidden mb-8 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">By truck count</h2>
          {rows.map((r) => (
            <div
              key={r.trucks}
              className={`rounded-xl border shadow-sm p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${r.netMonth >= 50000 ? 'ring-1 ring-green-500/30 dark:ring-green-400/20' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900 dark:text-white">{r.trucks} truck{r.trucks !== 1 ? 's' : ''}</span>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Net/yr {formatCurrency(r.netYear)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Revenue/day</span><span className="font-medium">{formatCurrency(r.revDay)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Revenue/month</span><span className="font-medium">{formatCurrency(r.revMonth)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Expenses/day</span><span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(r.expDay)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Expenses/month</span><span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(r.expMonth)}</span></div>
                <div className="flex justify-between col-span-2"><span className="text-gray-500 dark:text-gray-400">Net/month</span><span className="font-medium text-green-700 dark:text-green-400">{formatCurrency(r.netMonth)}</span></div>
              </div>
            </div>
          ))}
        </section>

        {/* Desktop: table */}
        <section className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800 mb-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Trucks</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Day</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Week</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Month</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Year</th>
                  <th className="text-right py-3 px-2 font-bold text-red-600 dark:text-red-400">Expenses/Day</th>
                  <th className="text-right py-3 px-2 font-bold text-red-600 dark:text-red-400">Expenses/Week</th>
                  <th className="text-right py-3 px-2 font-bold text-red-600 dark:text-red-400">Expenses/Month</th>
                  <th className="text-right py-3 px-2 font-bold text-red-600 dark:text-red-400">Expenses/Year</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Net Profit/Day</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Net Profit/Week</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Net Profit/Month</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Net Profit/Year</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.trucks}
                    className={`border-b border-gray-100 dark:border-gray-700/80 ${i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/80 dark:bg-gray-800/60'} ${r.netMonth >= 50000 ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white">{r.trucks}</td>
                    <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revDay)}</td>
                    <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revWeek)}</td>
                    <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revMonth)}</td>
                    <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revYear)}</td>
                    <td className="text-right py-2.5 px-2 text-red-600 dark:text-red-400">{formatCurrency(r.expDay)}</td>
                    <td className="text-right py-2.5 px-2 text-red-600 dark:text-red-400">{formatCurrency(r.expWeek)}</td>
                    <td className="text-right py-2.5 px-2 text-red-600 dark:text-red-400">{formatCurrency(r.expMonth)}</td>
                    <td className="text-right py-2.5 px-2 text-red-600 dark:text-red-400">{formatCurrency(r.expYear)}</td>
                    <td className="text-right py-2.5 px-2 font-medium text-green-700 dark:text-green-400">{formatCurrency(r.netDay)}</td>
                    <td className="text-right py-2.5 px-2 font-medium text-green-700 dark:text-green-400">{formatCurrency(r.netWeek)}</td>
                    <td className="text-right py-2.5 px-2 font-medium text-green-700 dark:text-green-400">{formatCurrency(r.netMonth)}</td>
                    <td className="text-right py-2.5 px-2 font-medium text-green-700 dark:text-green-400">{formatCurrency(r.netYear)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50 dark:bg-indigo-900/30 border-t-2 border-indigo-200 dark:border-indigo-800">
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">Summary (25 trucks)</td>
                  <td className="text-right py-3 px-2 font-medium text-gray-900 dark:text-white">{formatCurrency(rows[rows.length - 1].revDay)}</td>
                  <td className="text-right py-3 px-2 font-medium text-gray-900 dark:text-white">{formatCurrency(rows[rows.length - 1].revWeek)}</td>
                  <td className="text-right py-3 px-2 font-medium text-gray-900 dark:text-white">{formatCurrency(rows[rows.length - 1].revMonth)}</td>
                  <td className="text-right py-3 px-2 font-medium text-gray-900 dark:text-white">{formatCurrency(rows[rows.length - 1].revYear)}</td>
                  <td className="text-right py-3 px-2 font-medium text-red-600 dark:text-red-400">{formatCurrency(rows[rows.length - 1].expDay)}</td>
                  <td className="text-right py-3 px-2 font-medium text-red-600 dark:text-red-400">{formatCurrency(rows[rows.length - 1].expWeek)}</td>
                  <td className="text-right py-3 px-2 font-medium text-red-600 dark:text-red-400">{formatCurrency(rows[rows.length - 1].expMonth)}</td>
                  <td className="text-right py-3 px-2 font-medium text-red-600 dark:text-red-400">{formatCurrency(rows[rows.length - 1].expYear)}</td>
                  <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netDay)}</td>
                  <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netWeek)}</td>
                  <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netMonth)}</td>
                  <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netYear)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Chart: mobile = horizontal bars (one row per truck), desktop = vertical bars */}
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800 p-4 sm:p-6">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Trucks vs Net Profit / Year</h2>

          {/* Mobile: horizontal bar rows, vertical scroll */}
          <div className="md:hidden space-y-3">
            {rows.map((r) => (
              <div key={r.trucks} className="flex items-center gap-3">
                <span className="w-8 text-xs font-semibold text-gray-900 dark:text-white shrink-0">{r.trucks}</span>
                <div className="flex-1 min-w-0 h-8 flex items-center">
                  <div
                    className="h-6 rounded-r bg-indigo-500 dark:bg-indigo-600 min-w-[2px] transition-all"
                    style={{ width: `${Math.max(2, (r.netYear / maxNetYear) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0 w-20 text-right">{formatCurrency(r.netYear)}</span>
              </div>
            ))}
          </div>

          {/* Desktop: vertical bar chart */}
          <div className="hidden md:flex items-end gap-2 h-64">
            {rows.map((r) => (
              <div key={r.trucks} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{formatCurrency(r.netYear)}</span>
                <div
                  className="w-full rounded-t bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors min-h-[4px]"
                  style={{ height: `${Math.max(4, (r.netYear / maxNetYear) * 100)}%` }}
                  title={`${r.trucks} trucks: ${formatCurrency(r.netYear)}/year`}
                />
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{r.trucks}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Truck count → Net profit per year</p>
        </section>
      </div>
    </div>
  )
}
