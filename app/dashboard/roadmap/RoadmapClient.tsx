'use client'

const TRUCK_COUNTS = [1, 2, 5, 10, 15, 20, 25] as const

// Assumptions (slightly higher than actual to be safe)
const REVENUE_PER_TRUCK_DAY = 320
const DRIVER_PAY_WEEK = 600
const FUEL_MAINTENANCE_WEEK = 250
const INSURANCE_WEEK = 100
const ADMIN_SOFTWARE_WEEK = 60

const DAYS_PER_WEEK = 5
const WEEKS_PER_YEAR = 52
const MONTHS_PER_YEAR = 12

// Per truck (formulas)
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

export default function RoadmapClient() {
  const rows = TRUCK_COUNTS.map((n) => ({
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profit Roadmap</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            1099 delivery fleet — revenue, expenses, and net profit by truck count
          </p>
        </div>

        {/* Assumptions */}
        <div className="mb-8 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Assumptions (per truck)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Revenue:</span> <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(REVENUE_PER_TRUCK_DAY)}/day</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Driver (1099):</span> <span className="font-medium">{formatCurrency(DRIVER_PAY_WEEK)}/week</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Fuel & maintenance:</span> <span className="font-medium">{formatCurrency(FUEL_MAINTENANCE_WEEK)}/week</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Insurance:</span> <span className="font-medium">{formatCurrency(INSURANCE_WEEK)}/week</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Admin / software:</span> <span className="font-medium">{formatCurrency(ADMIN_SOFTWARE_WEEK)}/week</span></div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800 mb-8">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 font-bold text-gray-900 dark:text-white">Trucks</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Day</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Week</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Month</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Revenue/Year</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Expenses/Day</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Expenses/Week</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Expenses/Month</th>
                <th className="text-right py-3 px-2 font-bold text-gray-900 dark:text-white">Expenses/Year</th>
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
                  className={`border-b border-gray-100 dark:border-gray-700/80 ${
                    i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/80 dark:bg-gray-800/60'
                  } ${r.netMonth >= 50000 ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-white">{r.trucks}</td>
                  <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revDay)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revWeek)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revMonth)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-700 dark:text-gray-300">{formatCurrency(r.revYear)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-600 dark:text-gray-400">{formatCurrency(r.expDay)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-600 dark:text-gray-400">{formatCurrency(r.expWeek)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-600 dark:text-gray-400">{formatCurrency(r.expMonth)}</td>
                  <td className="text-right py-2.5 px-2 text-gray-600 dark:text-gray-400">{formatCurrency(r.expYear)}</td>
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
                <td className="text-right py-3 px-2 font-medium">{formatCurrency(rows[rows.length - 1].revDay)}</td>
                <td className="text-right py-3 px-2 font-medium">{formatCurrency(rows[rows.length - 1].revWeek)}</td>
                <td className="text-right py-3 px-2 font-medium">{formatCurrency(rows[rows.length - 1].revMonth)}</td>
                <td className="text-right py-3 px-2 font-medium">{formatCurrency(rows[rows.length - 1].revYear)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(rows[rows.length - 1].expDay)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(rows[rows.length - 1].expWeek)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(rows[rows.length - 1].expMonth)}</td>
                <td className="text-right py-3 px-2">{formatCurrency(rows[rows.length - 1].expYear)}</td>
                <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netDay)}</td>
                <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netWeek)}</td>
                <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netMonth)}</td>
                <td className="text-right py-3 px-2 font-bold text-green-700 dark:text-green-400">{formatCurrency(rows[rows.length - 1].netYear)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Chart: Trucks vs Net Profit/Year */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Trucks vs Net Profit / Year</h2>
          <div className="flex items-end gap-2 h-64">
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
        </div>
      </div>
    </div>
  )
}
