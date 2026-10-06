from io import BytesIO
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet,
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from PIL import Image

# =========================================================
# CONFIG
# =========================================================

PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

TOP_BLUE = "#0F5FD7"
HEADER_BLUE = "#173B72"
LIGHT_BLUE = "#EEF4FB"
BORDER_COLOR = "#DCE3EC"
TEXT_COLOR = "#24324A"
MUTED_COLOR = "#64748B"


# =========================================================
# LOGO / WATERMARK
# =========================================================


def get_watermark_path():
    """
    Returns the CarSync watermark path.

    Project structure:

    CarManagementSystem/
    ├── backend/
    │   └── app/services/reports/pdf_export.py
    └── frontend/
        └── assets/
            └── images/
                └── carsync-logo.jpeg
    """

    # pdf_export.py
    # reports -> services -> app -> backend
    backend_root = Path(__file__).resolve().parents[3]

    # Move from backend/ to project root
    project_root = backend_root.parent

    logo_path = project_root / "frontend" / "assets" / "images" / "carsync-logo.jpeg"

    watermark_path = backend_root / "uploads" / "carsync_watermark.png"

    # print("========================================")
    # print("CarSync PDF Logo Debug")
    # print("Logo path:", logo_path)
    # print("Logo exists:", logo_path.exists())
    # print("Watermark path:", watermark_path)
    # print("========================================")

    if not logo_path.exists():
        return None

    watermark_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    # -----------------------------------------
    # Create watermark
    # -----------------------------------------

    image = Image.open(logo_path).convert("RGBA")

    max_side = 450

    scale = min(
        max_side / image.width,
        max_side / image.height,
    )

    image = image.resize(
        (
            int(image.width * scale),
            int(image.height * scale),
        ),
        Image.LANCZOS,
    )

    # -----------------------------------------
    # Low opacity
    # -----------------------------------------

    alpha = Image.new(
        "L",
        image.size,
        0,
    )

    alpha.putdata([22] * (image.width * image.height))

    image.putalpha(alpha)

    image.save(
        watermark_path,
        "PNG",
    )

    return watermark_path


# =========================================================
# PAGE DESIGN
# =========================================================


def draw_page(canvas, doc):

    canvas.saveState()

    # -----------------------------------------------------
    # White background
    # -----------------------------------------------------

    canvas.setFillColor(colors.white)

    canvas.rect(
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        fill=1,
        stroke=0,
    )

    # -----------------------------------------------------
    # Top blue accent
    # -----------------------------------------------------

    canvas.setFillColor(colors.HexColor(TOP_BLUE))

    canvas.rect(
        0,
        PAGE_HEIGHT - 5 * mm,
        PAGE_WIDTH,
        5 * mm,
        fill=1,
        stroke=0,
    )

    # -----------------------------------------------------
    # Center watermark
    # -----------------------------------------------------

    watermark_path = get_watermark_path()

    if watermark_path:

        watermark_width = 115 * mm
        watermark_height = 115 * mm

        canvas.drawImage(
            str(watermark_path),
            (PAGE_WIDTH - watermark_width) / 2,
            (PAGE_HEIGHT - watermark_height) / 2 - 5 * mm,
            width=watermark_width,
            height=watermark_height,
            preserveAspectRatio=True,
            mask="auto",
        )

    # -----------------------------------------------------
    # Footer separator
    # -----------------------------------------------------

    canvas.setStrokeColor(colors.HexColor(BORDER_COLOR))

    canvas.setLineWidth(0.6)

    canvas.line(
        14 * mm,
        13 * mm,
        PAGE_WIDTH - 14 * mm,
        13 * mm,
    )

    # -----------------------------------------------------
    # Footer
    # -----------------------------------------------------

    canvas.setFont(
        "Helvetica",
        7.5,
    )

    canvas.setFillColor(colors.HexColor(MUTED_COLOR))

    canvas.drawString(
        14 * mm,
        7.5 * mm,
        "CarSync • Smart Vehicle Management System",
    )

    canvas.drawRightString(
        PAGE_WIDTH - 14 * mm,
        7.5 * mm,
        f"Page {doc.page}",
    )

    canvas.restoreState()


# =========================================================
# MAIN PDF GENERATOR
# =========================================================


def create_pdf_response(
    headers: list[str],
    rows: list[list],
    title: str = "Report",
    summary_data: list[tuple[str, str]] | None = None,
):
    output = BytesIO()

    document = SimpleDocTemplate(
        output,
        pagesize=landscape(A4),
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=17 * mm,
        bottomMargin=19 * mm,
    )

    styles = getSampleStyleSheet()

    # -----------------------------------------------------
    # Title
    # -----------------------------------------------------

    title_style = ParagraphStyle(
        "PremiumTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#14213D"),
        alignment=TA_LEFT,
        spaceAfter=2,
    )

    # -----------------------------------------------------
    # Subtitle
    # -----------------------------------------------------

    subtitle_style = ParagraphStyle(
        "PremiumSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor(MUTED_COLOR),
    )

    # -----------------------------------------------------
    # Table cells
    # -----------------------------------------------------

    cell_style = ParagraphStyle(
        "PremiumCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=10,
        textColor=colors.HexColor(TEXT_COLOR),
    )

    header_cell_style = ParagraphStyle(
        "PremiumHeader",
        parent=cell_style,
        fontName="Helvetica-Bold",
        textColor=colors.white,
    )

    story = []

    # =====================================================
    # TITLE
    # =====================================================

    story.append(
        Paragraph(
            title,
            title_style,
        )
    )

    story.append(
        Paragraph(
            get_report_subtitle(
                title,
                len(rows),
            ),
            subtitle_style,
        )
    )

    story.append(
        Spacer(
            1,
            7 * mm,
        )
    )

    # =====================================================
    # TABLE
    # =====================================================

    table_data = [
        [
            Paragraph(
                str(header),
                header_cell_style,
            )
            for header in headers
        ]
    ]

    for row in rows:

        table_data.append(
            [
                Paragraph(
                    "" if value is None else str(value),
                    cell_style,
                )
                for value in row
            ]
        )

    table = Table(
        table_data,
        repeatRows=1,
        hAlign="LEFT",
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor(HEADER_BLUE),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    7.5,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.35,
                    colors.HexColor(BORDER_COLOR),
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        colors.white,
                        colors.HexColor("#F7FAFC"),
                    ],
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, 0),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, 0),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 1),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 1),
                    (-1, -1),
                    7,
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(table)

    story.append(
        Spacer(
            1,
            8 * mm,
        )
    )

    # =====================================================
    # SUMMARY CARD
    # =====================================================

    if summary_data:

        summary_headers = [
            Paragraph(
                f"<b>{label}</b>",
                cell_style,
            )
            for label, value in summary_data
        ]

        summary_values = [
            Paragraph(
                str(value),
                cell_style,
            )
            for label, value in summary_data
        ]

        summary_table = Table(
            [
                summary_headers,
                summary_values,
            ]
        )

        summary_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor(LIGHT_BLUE),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.HexColor(BORDER_COLOR),
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.35,
                        colors.HexColor(BORDER_COLOR),
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                ]
            )
        )

        story.append(summary_table)

    # =====================================================
    # BUILD
    # =====================================================

    document.build(
        story,
        onFirstPage=draw_page,
        onLaterPages=draw_page,
    )

    output.seek(0)

    return output.getvalue()


# =========================================================
# SUBTITLE
# =========================================================


def get_report_subtitle(
    title: str,
    total_records: int,
):

    from datetime import datetime

    generated_at = datetime.now().strftime("%d %b %Y, %I:%M %p")

    return f"Generated on {generated_at} " f"• Total Records: {total_records}"
