"""Analisa seasonality (musim) harga saham per bulan.

Menggunakan data historis multi-tahun (default 5 tahun). Untuk tiap tahun,
hitung return kalender bulanan (close akhir bulan vs close akhir bulan
sebelumnya), lalu agregat per bulan: rata-rata return, probabilitas positif,
dan ranking.

Konvensi bulan: 1=Januari ... 12=Desember.
"""

from collections import defaultdict

BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
BULAN_FULL = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]


def _month_of(date_str):
    try:
        return int(str(date_str)[5:7])
    except (TypeError, ValueError):
        return None


def compute_seasonality(history, min_years=2):
    """Hitung seasonality dari history [{date, close}, ...].

    Kembalikan dict berisi: monthly list (12), summary, best, worst,
    next_month (untuk bulan berjalan).
    """
    if not history:
        return {"monthly": [], "summary": "Data historis belum cukup.", "best": None, "worst": None, "next_month": None}

    # urutkan berdasarkan tanggal
    rows = sorted(
        [r for r in history if r.get("date") and r.get("close") is not None],
        key=lambda r: r["date"],
    )
    if len(rows) < 20:
        return {"monthly": [], "summary": "Data historis belum cukup.", "best": None, "worst": None, "next_month": None}

    # ambil close terakhir tiap bulan
    monthly_close = {}
    for r in rows:
        key = str(r["date"])[:7]  # YYYY-MM
        monthly_close[key] = r["close"]

    months_sorted = sorted(monthly_close)
    if len(months_sorted) < 12 * min_years:
        return {"monthly": [], "summary": "Riwayat terlalu pendek untuk analisa musim.", "best": None, "worst": None, "next_month": None}

    # return bulanan per tahun
    year_months = defaultdict(list)  # bulan -> daftar return
    for prev, cur in zip(months_sorted, months_sorted[1:]):
        prev_close = monthly_close[prev]
        cur_close = monthly_close[cur]
        if not prev_close:
            continue
        ret = (cur_close - prev_close) / prev_close * 100
        month = _month_of(cur)
        if month:
            year_months[month].append(ret)

    if not year_months:
        return {"monthly": [], "summary": "Data tidak bisa dianalisa.", "best": None, "worst": None, "next_month": None}

    monthly = []
    for m in range(1, 13):
        rets = year_months.get(m, [])
        avg = sum(rets) / len(rets) if rets else None
        pos = sum(1 for r in rets if r > 0) / len(rets) if rets else None
        monthly.append({
            "month": m,
            "label": BULAN[m - 1],
            "full": BULAN_FULL[m - 1],
            "avg_return": round(avg, 2) if avg is not None else None,
            "prob_positive": round(pos * 100, 0) if pos is not None else None,
            "samples": len(rets),
        })

    ranked = [m for m in monthly if m["avg_return"] is not None and m["samples"] >= min_years]
    if not ranked:
        return {"monthly": monthly, "summary": "Data historis belum cukup untuk ranking.", "best": None, "worst": None, "next_month": None}

    ranked_sorted = sorted(ranked, key=lambda m: m["avg_return"], reverse=True)
    best = ranked_sorted[0]
    worst = ranked_sorted[-1]

    summary = _build_summary(monthly, best, worst, rows[-1]["date"])

    # bulan berikutnya (untuk antisipasi)
    last_year, last_month = int(str(rows[-1]["date"])[:4]), _month_of(rows[-1]["date"])
    next_m = (last_month % 12) + 1
    next_month = next((m for m in monthly if m["month"] == next_m), None)

    return {
        "monthly": monthly,
        "summary": summary,
        "best": best,
        "worst": worst,
        "next_month": next_month,
        "last_date": rows[-1]["date"],
    }


def _build_summary(monthly, best, worst, last_date):
    """Ringkasan naratif seasonality dalam Bahasa Indonesia."""
    best_p = best["prob_positive"]
    worst_p = worst["prob_positive"]
    parts = [
        f"Secara historis {best['full']} menjadi bulan terkuat {best['label']} "
        f"(rata-rata +{best['avg_return']:.1f}%, positif {best_p:.0f}% dari tahun ke tahun)."
    ]
    if worst["avg_return"] < 0:
        parts.append(
            f"Sebaliknya {worst['full']} cenderung melemah "
            f"(rata-rata {worst['avg_return']:.1f}%, positif hanya {worst_p:.0f}%)."
        )
    else:
        parts.append(
            f"Bulan paling lemah adalah {worst['full']} "
            f"(rata-rata +{worst['avg_return']:.1f}%, positif {worst_p:.0f}%)."
        )
    # deteksi pola kuartal
    q_map = {1: "Q1 (Jan-Mar)", 2: "Q2 (Apr-Jun)", 3: "Q3 (Jul-Sep)", 4: "Q4 (Okt-Des)"}
    q_avg = {q: [] for q in range(1, 5)}
    for m in monthly:
        if m["avg_return"] is not None:
            q_avg[(m["month"] - 1) // 3 + 1].append(m["avg_return"])
    q_avg = {q: (sum(v) / len(v) if v else None) for q, v in q_avg.items()}
    best_q = max(q_avg, key=lambda q: q_avg[q] if q_avg[q] is not None else -999)
    worst_q = min(q_avg, key=lambda q: q_avg[q] if q_avg[q] is not None else 999)
    if q_avg.get(best_q) is not None and q_avg.get(worst_q) is not None and q_avg[best_q] - q_avg[worst_q] >= 2:
        parts.append(
            f"Pola kuartal: {q_map[best_q]} relatif kuat (avg {q_avg[best_q]:+.1f}%), "
            f"{q_map[worst_q]} paling lemah (avg {q_avg[worst_q]:+.1f}%)."
        )
    parts.append("Musim bukan jaminan, gunakan sebagai pelengkap analisa fundamental & teknikal.")
    return " ".join(parts)