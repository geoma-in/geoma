function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const labelIfPresent = (id, label) => {
        const val = document.getElementById(id)?.value.trim();
        return val ? `${label}: ${val}` : " ";
    };
    const site = labelIfPresent("siteName", "Site");
    const siteout = site.replace(/^Site:\s*/, '').replace(/\s+/g, '_');
    const vendor = document.getElementById("vendorName").value || "Invoice";
    const worktype = document.getElementById("workType").value || " ";
    const mobile = labelIfPresent("mobileNumber", "Mobile");
    const email = labelIfPresent("email", "  Email");
    const address = labelIfPresent("address", "  Address");
    const received = parseInt(document.getElementById("amountReceived").value || 0);
    const today = new Date().toLocaleDateString("en-IN");

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - 2 * marginX;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(`${vendor}`, marginX + contentWidth / 2, 20, { align: "center" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`${worktype}`, marginX + contentWidth / 2, 26, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`${mobile} ${email}`, marginX + contentWidth / 2, 33, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`${address}`, marginX + contentWidth / 2, 40, { align: "center" });

    const lineY = 45;
    const lineWidth = contentWidth;
    const lineXStart = marginX + (contentWidth - lineWidth) / 2;
    const lineXEnd = lineXStart + lineWidth;

    doc.setDrawColor(0);
    doc.setLineWidth(0.1);
    doc.line(lineXStart, lineY, lineXEnd, lineY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${today}`, pageWidth - marginX, 50, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`${site}`, marginX, 50, { align: "left" });

    let y = 60;

    const addRows = entries.filter(e => e.type === 'add').map(e => [
        e.spaceType, e.feet, e.inch, e.feet2, e.inch2, e.area, e.rate, e.amount
    ]);

    const runRows = entries.filter(e => e.type === 'running').map(e => [
        e.spaceType, e.runningFeet, e.area, e.rate, e.amount
    ]);

    const miscRows = entries.filter(e => e.type === 'misc').map(e => [
        e.chargeType, e.days, e.extraHours, e.rate, e.amount
    ]);

    const lessRows = entries.filter(e => e.type === 'less').map(e => [
        e.spaceType, e.feet, e.inch, e.feet2, e.inch2, e.area, e.rate, e.amount
    ]);

    if (addRows.length > 0) {
        doc.autoTable({
            startY: y,
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: {
                fillColor: [200, 230, 245], textColor: [80, 80, 80], halign: 'left'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: marginX, right: marginX },
            head: [['Space Type', 'Length-Ft', 'Length-In', 'Width-Ft', 'Width-In', 'Area', 'Rate', 'Amount']],
            body: addRows
        });
        y = doc.lastAutoTable.finalY + 10;
    }



    if (runRows.length > 0) {
        doc.autoTable({
            startY: y,
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: {
                fillColor: [200, 230, 245], textColor: [80, 80, 80], halign: 'left'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: marginX, right: marginX },
            head: [['Space Type', 'Running Feet', 'Area', 'Rate', 'Amount']],
            body: runRows
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    if (miscRows.length > 0) {
        doc.autoTable({
            startY: y,
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: {
                fillColor: [200, 230, 245], textColor: [80, 80, 80], halign: 'left'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: marginX, right: marginX },
            head: [['Charge Type', 'Days', 'Overtime-Hours', 'Rate/day', 'Amount']],
            body: miscRows
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    if (lessRows.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text("Less", marginX, y);
        y += 4;

        doc.autoTable({
            startY: y,
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: {
                fillColor: [255, 225, 225], textColor: [80, 80, 80], halign: 'left'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: marginX, right: marginX },
            head: [['Space-Type', 'Length-Ft', 'Length-In', 'Width-Ft', 'Width-In', 'Area', 'Rate', 'Amount']],
            body: lessRows
        });
    }

    function formatNumber(value) {
        return Math.round(value).toLocaleString("en-IN");
    }

    if (doc.lastAutoTable) {
        const totalAdd = entries.filter(e => e.type === 'add').reduce((s, e) => s + e.amount, 0);
        const totalRunning = entries.filter(e => e.type === 'running').reduce((s, e) => s + e.amount, 0);
        const totalMisc = entries.filter(e => e.type === 'misc').reduce((s, e) => s + e.amount, 0);
        const subtotal = totalAdd + totalRunning + totalMisc
        const totalLess = entries.filter(e => e.type === 'less').reduce((s, e) => s + e.amount, 0);
        const net = subtotal - totalLess;
        const balance = net - received;

        const summaryRows = [
            ["Sub-Total", formatNumber(subtotal)],
            ["Less Total", formatNumber(totalLess)],
            ["Net Total", formatNumber(net)],
            ["Amount Received", formatNumber(received)],
            ["Balance", formatNumber(balance)]
        ];

        formattedRows = summaryRows;

        const safeBottom = 287;
        const spaceNeeded = formattedRows.length * 10 + 20;

        let summaryStartY = doc.lastAutoTable.finalY + 12;
        if (summaryStartY + spaceNeeded > safeBottom) {
            doc.addPage();
            summaryStartY = 20;
        }

        doc.autoTable({
            startY: summaryStartY,
            margin: { left: 140 },
            styles: { font: 'helvetica', fontSize: 10 },
            bodyStyles: { textColor: [80, 80, 80] },
            headStyles: { fillColor: [240, 240, 240] },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold' },
                1: { halign: 'right', fontStyle: 'bold', font: 'courier', fontSize: 11 }
            },
            body: summaryRows,
            didParseCell: function (data) {
                const rowIndex = data.row.index;
                const colIndex = data.column.index;
                const label = data.cell.raw;

                if (label === "Net Total" || (rowIndex === 2 && colIndex === 1)) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = [0, 102, 204];
                }

                if (label === "Amount Received" || (rowIndex === 3 && colIndex === 1)) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = [0, 128, 0];
                }

                if (label === "Balance" || (rowIndex === 4 && colIndex === 1)) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.textColor = balance > 0 ? [200, 0, 0] : [0, 150, 0];
                }
            }
        });
    }

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Thank you for your business!", pageWidth / 2, 287, { align: "center" });

    const fileName = `Invoice_${siteout}.pdf`;
    doc.save(fileName);
}
