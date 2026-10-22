
from datetime import datetime
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_calculation_pdf(report_data: dict) -> bytes:
    """Generate a professional PDF report for an engineering calculation."""

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Engineering Calculation Report",
        author="Industrial Engineering Calculator",
    )

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontSize=20,
            leading=25,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#17365D"),
            spaceAfter=8 * mm,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#17365D"),
            spaceBefore=5 * mm,
            spaceAfter=3 * mm,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ReportBody",
            parent=styles["BodyText"],
            fontSize=9,
            leading=13,
            alignment=TA_LEFT,
        )
    )

    story = []

    def safe_text(value) -> str:
        """Escape user-supplied text before placing it in a PDF paragraph."""
        return escape(str(value))

    def add_paragraph(value, style="ReportBody"):
        story.append(Paragraph(safe_text(value), styles[style]))

    def add_section(title):
        add_paragraph(title, "SectionHeading")

    # Report heading
    add_paragraph("ENGINEERING CALCULATION REPORT", "ReportTitle")

    generated_at = datetime.now().astimezone().strftime(
        "%Y-%m-%d %H:%M:%S %Z"
    )

    add_paragraph(f"Generated on: {generated_at}")
    story.append(Spacer(1, 4 * mm))

    # Calculation details
    add_section("1. Calculation Details")

    details = [
        ["Field", "Details"],
        ["Calculation", str(report_data.get("formula_name", "Engineering Calculation"))],
        ["Category", str(report_data.get("category", "Not specified"))],
        ["Equation", str(report_data.get("equation", "Not provided"))],
    ]

    details_table = Table(
        details,
        colWidths=[42 * mm, 130 * mm],
        repeatRows=1,
    )

    details_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8C4D6")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F5F7FA")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    story.append(details_table)

    # Input values
    add_section("2. Input Parameters")

    inputs = report_data.get("inputs", {})
    input_units = report_data.get("input_units", {})

    input_rows = [["Parameter", "Value", "Unit"]]

    if isinstance(inputs, dict) and inputs:
        for name, value in inputs.items():
            unit = input_units.get(name, "") if isinstance(input_units, dict) else ""
            input_rows.append([str(name), str(value), str(unit or "—")])
    else:
        input_rows.append(["No input parameters supplied", "—", "—"])

    input_table = Table(
        input_rows,
        colWidths=[70 * mm, 55 * mm, 47 * mm],
        repeatRows=1,
    )

    input_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#DCE6F1")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8C4D6")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )

    story.append(input_table)

    # Result
    add_section("3. Final Result")

    result = report_data.get("result", "Not provided")
    result_unit = report_data.get("unit", "")

    result_table = Table(
        [
            ["Calculated Result"],
            [f"{result} {result_unit}".strip()],
        ],
        colWidths=[172 * mm],
    )

    result_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#E2F0D9")),
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 1), (-1, 1), 14),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#B8C4D6")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    story.append(result_table)

    # Calculation steps
    add_section("4. Calculation Steps")

    steps = report_data.get("steps", [])

    if isinstance(steps, list) and steps:
        for index, step in enumerate(steps, start=1):
            if isinstance(step, dict):
                description = step.get(
                    "description",
                    step.get("text", step.get("title", str(step))),
                )
            else:
                description = str(step)

            add_paragraph(f"{index}. {description}")
            story.append(Spacer(1, 1.5 * mm))
    else:
        add_paragraph(
            "Detailed calculation steps were not supplied for this report."
        )

    # Assumptions and notes
    add_section("5. Assumptions and Notes")

    assumptions = report_data.get("assumptions", [])

    if isinstance(assumptions, list) and assumptions:
        for assumption in assumptions:
            add_paragraph(f"- {assumption}")
    else:
        add_paragraph(
            "The calculation uses the supplied input values and the selected "
            "formula. Confirm the input units, operating conditions, and "
            "engineering assumptions before using the result for real-world "
            "design or safety-critical decisions."
        )

    story.append(Spacer(1, 8 * mm))

    add_paragraph(
        "Report generated by Industrial Engineering Calculator."
    )

    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(
            18 * mm,
            10 * mm,
            "Industrial Engineering Calculator",
        )
        canvas.drawRightString(
            A4[0] - 18 * mm,
            10 * mm,
            f"Page {doc.page}",
        )
        canvas.restoreState()

    document.build(
        story,
        onFirstPage=add_page_number,
        onLaterPages=add_page_number,
    )

    return buffer.getvalue()
