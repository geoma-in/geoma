function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const site = document.getElementById("siteName").value || "Construction Report";
    const vendor = document.getElementById("vendorName").value || " ";
    const mobile = document.getElementById("mobileNumber").value || " ";
    const received = parseInt(document.getElementById("amountReceived").value || 0);
    const today = new Date().toLocaleDateString("en-IN");

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - 2 * marginX;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Invoice", marginX + contentWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${vendor}`, marginX, 30);
    doc.text(`${mobile}`, marginX, 35);
    doc.text(`Date: ${today}`, pageWidth - marginX, 30, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Site: ${site}`, marginX + contentWidth / 2, 43, {align: "center"});

    let y = 55;

    const addRows = entries.filter(e => e.type === 'add').map(e => [
        e.spaceType, e.feet, e.inch, e.feet2, e.inch2, e.area, e.rate, e.amount, e.floorCount, e.total
    ]);
    const lessRows = entries.filter(e => e.type === 'less').map(e => [
        e.spaceType, e.feet, e.inch, e.feet2, e.inch2, e.area, e.rate, e.amount, e.floorCount, e.total
    ]);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Planned Tile Work Area", marginX, y);
    y += 4;

    doc.autoTable({
        startY: y,
        styles: { font: 'helvetica', fontSize: 10 },
        headStyles: {
            fillColor: [173, 216, 230], textColor: [80, 80, 80], halign: 'left'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: marginX, right: marginX },
        head: [['Space Type', 'Len-Ft', 'Len-In', 'Wid-Ft', 'Wid-In', 'Area', 'Rate', 'Amount', 'Floor', 'Total']],
        body: addRows
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Excluded Areas (Pre-built) to be deducted", marginX, y);
    y += 4;

    doc.autoTable({
        startY: y,
        styles: { font: 'helvetica', fontSize: 10 },
        headStyles: {
            fillColor: [255, 204, 203], textColor: [80, 80, 80], halign: 'left'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: marginX, right: marginX },
        head: [['Space-Type', 'Len-Ft', 'Len-In', 'Wid-Ft', 'Wid-In', 'Area', 'Rate', 'Amount', 'Floor', 'Total']],
        body: addRows
    });

    function formatNumber(value) {
        return Math.round(value).toLocaleString("en-IN");
    }

    const totalAdd = entries.filter(e => e.type === 'add').reduce((s, e) => s + e.total, 0);
    const totalLess = entries.filter(e => e.type === 'less').reduce((s, e) => s + e.total, 0);
    const net = totalAdd - totalLess;
    const balance = net - received;

    const summaryX = 140;
    const valueX = 194;
    const startY = doc.lastAutoTable.finalY + 12;
    const rowHeight = 9;

    const summaryRows = [
        { label: "Sub-Total", value: totalAdd, color: [80, 80, 80] },
        { label: "Less Total", value: totalLess, color: [80, 80, 80] },
        { label: "Net Total", value: net, color: [0, 102, 204] },
        { label: "Amount Received", value: received, color: [0, 128, 0] },
        {
            label: "Balance",
            value: balance,
            color: balance > 0 ? [200, 0, 0] : [0, 150, 0]
        }
    ];

    summaryRows.forEach((row, i) => {
        const currentY = startY + i * rowHeight;

        if (i % 2 === 1) {
            doc.setFillColor(242, 242, 242);
            doc.rect(summaryX - 3, currentY - 6, valueX - (summaryX - 5), rowHeight, 'F');
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...row.color);
        doc.text(row.label, summaryX, currentY);

        const numStr = formatNumber(row.value);
        doc.setFont("courier", "bold");
        doc.setFontSize(11);
        doc.text(numStr, valueX, currentY, { align: 'right' });
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Thank you for your business!", pageWidth / 2, 287, { align: "center" });

    const fileName = `Tiles_Work_Invoice_${site.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
}
