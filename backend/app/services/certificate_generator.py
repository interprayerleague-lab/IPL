"""
Certificate PDF Generator
Generates professional certificates for completed programmes
"""

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from io import BytesIO
from typing import Optional


class CertificateGenerator:
    """Generate PDF certificates"""

    @staticmethod
    def generate_certificate(
        student_name: str,
        programme_title: str,
        certificate_number: str,
        issue_date: datetime,
    ) -> BytesIO:
        """
        Generate a professional certificate PDF

        Args:
            student_name: Full name of the student
            programme_title: Title of the completed programme
            certificate_number: Unique certificate number
            issue_date: Date certificate was issued

        Returns:
            BytesIO object containing the PDF
        """
        # Create PDF in memory
        buffer = BytesIO()

        # Use landscape A4 for certificate
        page_width, page_height = landscape(A4)

        # Create canvas
        c = canvas.Canvas(buffer, pagesize=landscape(A4))

        # Set metadata
        c.setTitle(f"Certificate - {student_name}")
        c.setAuthor("School of Discipleship")
        c.setSubject(f"Certificate of Completion - {programme_title}")

        # Draw border
        CertificateGenerator._draw_border(c, page_width, page_height)

        # Draw header
        CertificateGenerator._draw_header(c, page_width, page_height)

        # Draw main content
        CertificateGenerator._draw_content(
            c, page_width, page_height, student_name, programme_title
        )

        # Draw footer
        CertificateGenerator._draw_footer(
            c, page_width, page_height, certificate_number, issue_date
        )

        # Finalize PDF
        c.showPage()
        c.save()

        # Reset buffer position
        buffer.seek(0)
        return buffer

    @staticmethod
    def _draw_border(c: canvas.Canvas, width: float, height: float):
        """Draw decorative border"""
        margin = 0.5 * inch

        # Outer border - thick line
        c.setStrokeColor(colors.HexColor("#1a365d"))  # Dark blue
        c.setLineWidth(3)
        c.rect(margin, margin, width - 2 * margin, height - 2 * margin)

        # Inner border - thin line
        inner_margin = margin + 0.15 * inch
        c.setStrokeColor(colors.HexColor("#2c5282"))  # Medium blue
        c.setLineWidth(1)
        c.rect(
            inner_margin,
            inner_margin,
            width - 2 * inner_margin,
            height - 2 * inner_margin,
        )

    @staticmethod
    def _draw_header(c: canvas.Canvas, width: float, height: float):
        """Draw certificate header"""
        # School name
        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(colors.HexColor("#1a365d"))
        c.drawCentredString(width / 2, height - 1.5 * inch, "School of Discipleship")

        # Certificate title
        c.setFont("Helvetica", 16)
        c.setFillColor(colors.HexColor("#2d3748"))
        c.drawCentredString(width / 2, height - 2 * inch, "Certificate of Completion")

    @staticmethod
    def _draw_content(
        c: canvas.Canvas,
        width: float,
        height: float,
        student_name: str,
        programme_title: str,
    ):
        """Draw main certificate content"""
        center_y = height / 2

        # "This certifies that"
        c.setFont("Helvetica", 14)
        c.setFillColor(colors.HexColor("#4a5568"))
        c.drawCentredString(width / 2, center_y + 1.2 * inch, "This certifies that")

        # Student name (large and prominent)
        c.setFont("Helvetica-Bold", 32)
        c.setFillColor(colors.HexColor("#1a365d"))
        c.drawCentredString(width / 2, center_y + 0.5 * inch, student_name)

        # Underline for name
        name_width = c.stringWidth(student_name, "Helvetica-Bold", 32)
        c.setStrokeColor(colors.HexColor("#2c5282"))
        c.setLineWidth(2)
        c.line(
            (width - name_width) / 2,
            center_y + 0.4 * inch,
            (width + name_width) / 2,
            center_y + 0.4 * inch,
        )

        # "has successfully completed"
        c.setFont("Helvetica", 14)
        c.setFillColor(colors.HexColor("#4a5568"))
        c.drawCentredString(
            width / 2, center_y - 0.3 * inch, "has successfully completed"
        )

        # Programme title
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(colors.HexColor("#2c5282"))
        c.drawCentredString(width / 2, center_y - 0.9 * inch, programme_title)

        # Description
        c.setFont("Helvetica", 12)
        c.setFillColor(colors.HexColor("#718096"))
        c.drawCentredString(
            width / 2,
            center_y - 1.5 * inch,
            "demonstrating commitment to spiritual growth and biblical knowledge",
        )

    @staticmethod
    def _draw_footer(
        c: canvas.Canvas,
        width: float,
        height: float,
        certificate_number: str,
        issue_date: datetime,
    ):
        """Draw certificate footer with date, number, and signature line"""
        footer_y = 1.5 * inch

        # Format date
        date_str = issue_date.strftime("%B %d, %Y")

        # Left side - Date issued
        c.setFont("Helvetica", 11)
        c.setFillColor(colors.HexColor("#4a5568"))
        c.drawString(1.5 * inch, footer_y + 0.5 * inch, "Date Issued:")

        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(colors.HexColor("#1a365d"))
        c.drawString(1.5 * inch, footer_y + 0.2 * inch, date_str)

        # Right side - Certificate number
        c.setFont("Helvetica", 11)
        c.setFillColor(colors.HexColor("#4a5568"))
        c.drawRightString(
            width - 1.5 * inch, footer_y + 0.5 * inch, "Certificate Number:"
        )

        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(colors.HexColor("#1a365d"))
        c.drawRightString(width - 1.5 * inch, footer_y + 0.2 * inch, certificate_number)

        # Center - Signature line
        signature_y = footer_y - 0.5 * inch
        signature_width = 2.5 * inch

        # Signature line
        c.setStrokeColor(colors.HexColor("#2c5282"))
        c.setLineWidth(1)
        c.line(
            (width - signature_width) / 2,
            signature_y,
            (width + signature_width) / 2,
            signature_y,
        )

        # "Director" label below line
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor("#718096"))
        c.drawCentredString(width / 2, signature_y - 0.25 * inch, "Director")
        c.drawCentredString(
            width / 2, signature_y - 0.45 * inch, "School of Discipleship"
        )


def generate_certificate_pdf(
    student_name: str,
    programme_title: str,
    certificate_number: str,
    issue_date: Optional[datetime] = None,
) -> BytesIO:
    """
    Convenience function to generate certificate PDF

    Args:
        student_name: Full name of the student
        programme_title: Title of the completed programme
        certificate_number: Unique certificate number
        issue_date: Date certificate was issued (defaults to now)

    Returns:
        BytesIO object containing the PDF
    """
    if issue_date is None:
        issue_date = datetime.utcnow()

    return CertificateGenerator.generate_certificate(
        student_name=student_name,
        programme_title=programme_title,
        certificate_number=certificate_number,
        issue_date=issue_date,
    )
