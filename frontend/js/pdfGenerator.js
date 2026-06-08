/* PDF Report Generator Utility */

(function() {
    const { jsPDF } = window.jspdf;

    const ThemeColors = {
        dark: {
            bg: [15, 23, 42],          // #0f172a
            cardBg: [21, 30, 46],      // #151e2e
            cardBorder: [31, 41, 61],  // #1f293d
            text: [243, 244, 246],     // #f3f4f6 (gray-100)
            textSecondary: [156, 163, 175], // #9ca3af (gray-400)
            accent: [20, 184, 166],    // #14b8a6 (teal)
            success: [16, 185, 129],   // #10b981 (green)
            danger: [239, 68, 68],     // #ef4444 (red)
            tableHeader: [20, 184, 166],
            tableHeaderTxt: [15, 23, 42],
            gridLine: [31, 41, 61]
        },
        light: {
            bg: [255, 255, 255],
            cardBg: [249, 250, 251],   // #f9fafb
            cardBorder: [229, 231, 235], // #e5e7eb
            text: [31, 41, 55],        // #1f2937 (gray-800)
            textSecondary: [107, 114, 128], // #6b7280 (gray-500)
            accent: [13, 148, 136],    // #0d9488 (teal)
            success: [16, 185, 129],
            danger: [239, 68, 68],
            tableHeader: [13, 148, 136],
            tableHeaderTxt: [255, 255, 255],
            gridLine: [229, 231, 235]
        }
    };

    // Helper: Draw brand emblem
    function drawBrandEmblem(doc, cx, cy, isDark) {
        const colors = ThemeColors[isDark ? 'dark' : 'light'];
        const r = colors.accent;
        
        // Draw outer diamond
        doc.setFillColor(r[0], r[1], r[2]);
        doc.triangle(cx, cy - 6, cx - 6, cy, cx + 6, cy, 'F');
        doc.triangle(cx, cy + 6, cx - 6, cy, cx + 6, cy, 'F');

        // Draw inner diamond (hollow core effect)
        const bg = colors.bg;
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.triangle(cx, cy - 3, cx - 3, cy, cx + 3, cy, 'F');
        doc.triangle(cx, cy + 3, cx - 3, cy, cx + 3, cy, 'F');

        // Draw secondary spark core
        doc.setFillColor(r[0], r[1], r[2]);
        doc.circle(cx, cy, 1.2, 'F');

        // Small decorative spark dots
        doc.circle(cx - 8, cy - 3, 0.6, 'F');
        doc.circle(cx + 8, cy + 3, 0.6, 'F');
    }

    // Helper: Draw header block
    function drawReportHeader(doc, title, subtitle, isDark) {
        const colors = ThemeColors[isDark ? 'dark' : 'light'];
        const width = doc.internal.pageSize.getWidth();

        // 1. Draw branding emblem
        drawBrandEmblem(doc, 22, 20, isDark);

        // 2. Draw brand title
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        doc.text("PLACEMENT TRACKER", 34, 18);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        doc.text("INTERVIEW & PREPARATION SUITE", 34, 23);

        // 3. Draw Report title (right aligned)
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, width - 14 - titleWidth, 18);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        const subWidth = doc.getTextWidth(subtitle);
        doc.text(subtitle, width - 14 - subWidth, 23);

        // 4. Draw header underline rule
        doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
        doc.setLineWidth(0.75);
        doc.line(14, 28, width - 14, 28);
    }

    // Helper: Initialize PDF with solid background color
    function initPdfWithBackground(isDark) {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Color the initial page manually
        const w = doc.internal.pageSize.getWidth();
        const h = doc.internal.pageSize.getHeight();
        const colors = ThemeColors[isDark ? 'dark' : 'light'];
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.rect(0, 0, w, h, 'F');

        return doc;
    }

    // Helper: Finalize document with header line, page numbers, and timestamps
    function finalizeDocument(doc, isDark) {
        const pageCount = doc.internal.getNumberOfPages();
        const colors = ThemeColors[isDark ? 'dark' : 'light'];
        const width = doc.internal.pageSize.getWidth();
        const height = doc.internal.pageSize.getHeight();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer separation line
            doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
            doc.setLineWidth(0.5);
            doc.line(14, height - 14, width - 14, height - 14);

            // Footer text
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
            
            const timestamp = `Report generated on: ${new Date().toLocaleString()}`;
            const pageNum = `Page ${i} of ${pageCount}`;
            
            doc.text(timestamp, 14, height - 9);
            doc.text(pageNum, width - 14 - doc.getTextWidth(pageNum), height - 9);
        }
    }

    const PdfGenerator = {
        /**
         * Generates individual student placement readiness report
         */
        async downloadStudentReport(student, applications = [], notes = [], themeName = 'dark') {
            const isDark = themeName === 'dark';
            const doc = initPdfWithBackground(isDark);
            const colors = ThemeColors[isDark ? 'dark' : 'light'];
            const width = doc.internal.pageSize.getWidth();
            let y = 38;

            const ensureSpace = (h) => {
                const limit = doc.internal.pageSize.getHeight() - 22;
                if (y + h > limit) {
                    doc.addPage();
                    const w = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
                    doc.rect(0, 0, w, pageHeight, 'F');
                    drawReportHeader(doc, "Placement Report", student.name || "Student", isDark);
                    y = 38;
                }
            };

            // Draw header on page 1
            drawReportHeader(doc, "Placement Report", student.name || "Student", isDark);

            // 1. Student Information Card
            ensureSpace(50);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("STUDENT PROFILE", 14, y);
            y += 5;

            const cardStartY = y;
            const cardHeight = 44;
            
            // Draw card background
            doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
            doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
            doc.roundedRect(14, cardStartY, width - 28, cardHeight, 2.5, 2.5, 'FD');

            doc.setFontSize(8.5);
            const colWidth = (width - 28) / 2;

            const fields = [
                { label: "Full Name", val: student.name },
                { label: "Email Address", val: student.email },
                { label: "Phone Number", val: student.phoneNumber || student.phone },
                { label: "College / Institution", val: student.collegeName || student.college },
                { label: "Course / Degree", val: student.course },
                { label: "Branch / Dept", val: student.branch },
                { label: "Graduation Year", val: student.graduationYear },
                { label: "Core Skills", val: student.skills }
            ];

            fields.forEach((f, idx) => {
                const colIdx = idx % 2;
                const rowIdx = Math.floor(idx / 2);
                const rx = 18 + colIdx * colWidth;
                const ry = cardStartY + 8 + rowIdx * 8.5;

                doc.setFont("Helvetica", "bold");
                doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
                doc.text(f.label + ":", rx, ry);

                doc.setFont("Helvetica", "normal");
                doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                const valStr = String(f.val || 'Not Provided');
                // Trim long skills list
                const finalStr = (f.label === "Core Skills" && valStr.length > 38) ? valStr.substring(0, 36) + "..." : valStr;
                doc.text(finalStr, rx + doc.getTextWidth(f.label + ":") + 2, ry);
            });
            y += cardHeight + 10;

            // 2. Placement Statistics Row
            ensureSpace(30);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("PLACEMENT STATISTICS", 14, y);
            y += 5;

            const total = applications.length;
            const selected = applications.filter(a => a.status === 'Selected').length;
            const rejected = applications.filter(a => a.status === 'Rejected').length;
            const active = applications.filter(a => ['Applied', 'Interview Scheduled', 'Pending'].includes(a.status)).length;
            const successRate = total > 0 ? ((selected / total) * 100).toFixed(1) : '0';

            const statCards = [
                { label: "Total Apps", val: total, col: colors.accent },
                { label: "Active Apps", val: active, col: [59, 130, 246] },
                { label: "Selected", val: selected, col: colors.success },
                { label: "Rejected", val: rejected, col: colors.danger },
                { label: "Success Rate", val: `${successRate}%`, col: [245, 158, 11] }
            ];

            const statW = (width - 28 - 16) / 5;
            statCards.forEach((c, idx) => {
                const cx = 14 + idx * (statW + 4);
                doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
                doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
                doc.roundedRect(cx, y, statW, 20, 2, 2, 'FD');

                // Color accent strip
                doc.setFillColor(c.col[0], c.col[1], c.col[2]);
                doc.rect(cx, y, statW, 1.5, 'F');

                doc.setFont("Helvetica", "bold");
                doc.setFontSize(10.5);
                doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                doc.text(String(c.val), cx + statW / 2, y + 9.5, { align: 'center' });

                doc.setFont("Helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
                doc.text(c.label, cx + statW / 2, y + 16, { align: 'center' });
            });
            y += 30;

            // 3. Applications Table
            ensureSpace(40);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("JOB APPLICATIONS", 14, y);
            y += 5;

            const tableRows = applications.map(app => [
                app.companyName || 'N/A',
                app.role || 'N/A',
                app.status || 'N/A',
                app.priority || 'N/A',
                app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A',
                app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : 'N/A'
            ]);

            doc.autoTable({
                startY: y,
                head: [['Company', 'Role', 'Status', 'Priority', 'Applied Date', 'Interview Date']],
                body: tableRows.length > 0 ? tableRows : [['No applications logged', '', '', '', '', '']],
                theme: 'striped',
                headStyles: {
                    fillColor: colors.tableHeader,
                    textColor: colors.tableHeaderTxt,
                    fontStyle: 'bold',
                    fontSize: 8.5
                },
                bodyStyles: {
                    fillColor: colors.cardBg,
                    textColor: colors.text,
                    borderColor: colors.cardBorder,
                    fontSize: 8
                },
                alternateRowStyles: {
                    fillColor: isDark ? [28, 40, 61] : [255, 255, 255]
                },
                margin: { left: 14, right: 14 },
                willDrawPage: (data) => {
                    if (data.pageNumber > 1) {
                        const w = doc.internal.pageSize.getWidth();
                        const h = doc.internal.pageSize.getHeight();
                        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
                        doc.rect(0, 0, w, h, 'F');
                        drawReportHeader(doc, "Placement Report", student.name || "Student", isDark);
                    }
                }
            });

            y = doc.lastAutoTable.finalY + 10;

            // 4. Upcoming Interviews
            ensureSpace(28);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("UPCOMING INTERVIEWS", 14, y);
            y += 5;

            const scheduled = applications.filter(a => a.status === 'Interview Scheduled');
            if (scheduled.length === 0) {
                doc.setFont("Helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
                doc.text("No upcoming interviews scheduled.", 14, y);
                y += 10;
            } else {
                scheduled.slice(0, 3).forEach(item => {
                    ensureSpace(10);
                    // Bullet point
                    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
                    doc.circle(17, y - 2, 1, 'F');
                    
                    doc.setFont("Helvetica", "bold");
                    doc.setFontSize(9);
                    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                    doc.text(`${item.companyName} - ${item.role}`, 22, y);

                    doc.setFont("Helvetica", "normal");
                    const dateStr = item.interviewDate ? new Date(item.interviewDate).toLocaleDateString() : 'N/A';
                    doc.text(`Scheduled Date: ${dateStr}`, width - 14 - doc.getTextWidth(`Scheduled Date: ${dateStr}`), y);
                    y += 6.5;
                });
                y += 4;
            }

            // 5. Notes Summary
            ensureSpace(28);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("NOTES & COGNITIVE LOGS", 14, y);
            y += 5;

            if (notes.length === 0) {
                doc.setFont("Helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
                doc.text("No notes saved yet.", 14, y);
                y += 10;
            } else {
                notes.slice(0, 3).forEach(note => {
                    ensureSpace(12);
                    // Bullet square
                    doc.setFillColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
                    doc.rect(14, y - 4.5, 3.5, 3.5, 'F');

                    doc.setFont("Helvetica", "bold");
                    doc.setFontSize(9);
                    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                    doc.text(note.title || 'Untitled Note', 21, y - 1);

                    doc.setFont("Helvetica", "normal");
                    doc.setFontSize(7.5);
                    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
                    const coll = note.collectionId?.name || note.collectionName || 'Uncategorized';
                    const mod = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'N/A';
                    doc.text(`Collection: ${coll}  |  Last Revised: ${mod}`, 21, y + 2.5);
                    y += 8.5;
                });
            }

            finalizeDocument(doc, isDark);
            
            const cleanName = (student.name || "Student").replace(/[^a-z0-9]/gi, '_');
            const cleanDate = new Date().toISOString().split('T')[0];
            doc.save(`StudentReport_${cleanName}_${cleanDate}.pdf`);
        },

        /**
         * Generates consolidated platform placement metrics report
         */
        async downloadConsolidatedReport(stats, students = [], applications = [], themeName = 'dark') {
            const isDark = themeName === 'dark';
            const doc = initPdfWithBackground(isDark);
            const colors = ThemeColors[isDark ? 'dark' : 'light'];
            const width = doc.internal.pageSize.getWidth();
            let y = 38;

            const ensureSpace = (h) => {
                const limit = doc.internal.pageSize.getHeight() - 22;
                if (y + h > limit) {
                    doc.addPage();
                    const w = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
                    doc.rect(0, 0, w, pageHeight, 'F');
                    drawReportHeader(doc, "Consolidated Report", "Placement Analytics", isDark);
                    y = 38;
                }
            };

            // Draw header on page 1
            drawReportHeader(doc, "Consolidated Report", "Placement Analytics", isDark);

            // 1. Platform Summary Cards (2x3 Grid)
            ensureSpace(55);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("PLATFORM PLACEMENT SUMMARY", 14, y);
            y += 5;

            const gridStats = [
                { label: "Total Candidates", val: stats.totalStudents, col: colors.accent },
                { label: "Total Applications", val: stats.totalApplications, col: [99, 102, 241] }, // Indigo
                { label: "Active Applications", val: stats.activeApplications, col: [6, 182, 212] }, // Cyan
                { label: "Selected Students", val: stats.selectedStudents, col: colors.success },
                { label: "Rejected Applications", val: stats.rejectedApplications, col: colors.danger },
                { label: "Success Conversion", val: `${stats.successRate || 0}%`, col: [245, 158, 11] } // Amber
            ];

            const statCardW = (width - 28 - 10) / 3;
            const statCardH = 18;

            // Row 1
            for (let i = 0; i < 3; i++) {
                const stat = gridStats[i];
                const cx = 14 + i * (statCardW + 5);
                doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
                doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
                doc.roundedRect(cx, y, statCardW, statCardH, 2, 2, 'FD');
                
                doc.setFillColor(stat.col[0], stat.col[1], stat.col[2]);
                doc.rect(cx, y, statCardW, 1.2, 'F');

                doc.setFont("Helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                doc.text(String(stat.val), cx + statCardW / 2, y + 8, { align: 'center' });

                doc.setFont("Helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
                doc.text(stat.label, cx + statCardW / 2, y + 14, { align: 'center' });
            }
            y += statCardH + 5;

            // Row 2
            for (let i = 0; i < 3; i++) {
                const stat = gridStats[i + 3];
                const cx = 14 + i * (statCardW + 5);
                doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
                doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
                doc.roundedRect(cx, y, statCardW, statCardH, 2, 2, 'FD');
                
                doc.setFillColor(stat.col[0], stat.col[1], stat.col[2]);
                doc.rect(cx, y, statCardW, 1.2, 'F');

                doc.setFont("Helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                doc.text(String(stat.val), cx + statCardW / 2, y + 8, { align: 'center' });

                doc.setFont("Helvetica", "normal");
                doc.setFontSize(7.5);
                doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
                doc.text(stat.label, cx + statCardW / 2, y + 14, { align: 'center' });
            }
            y += statCardH + 10;

            // 2. Placement Status distribution Chart (Vector drawing)
            ensureSpace(70);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("APPLICATION PIPELINE DISTRIBUTION", 14, y);
            y += 5;

            const chartStartY = y;
            const chartH = 48;
            doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
            doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
            doc.roundedRect(14, chartStartY, width - 28, chartH, 3, 3, 'FD');

            // Collect distribution counts
            const counts = {
                "Applied": 0,
                "Interview Scheduled": 0,
                "Selected": 0,
                "Rejected": 0
            };
            applications.forEach(a => {
                if (counts[a.status] !== undefined) counts[a.status]++;
                else if (a.status === "Pending") counts["Applied"]++; // Map pending to applied
            });

            const maxCount = Math.max(...Object.values(counts), 1);
            const chartData = [
                { label: "Applied", val: counts["Applied"], col: colors.accent },
                { label: "Scheduled", val: counts["Interview Scheduled"], col: [59, 130, 246] },
                { label: "Selected", val: counts["Selected"], col: colors.success },
                { label: "Rejected", val: counts["Rejected"], col: colors.danger }
            ];

            const chartW = width - 28;
            const barW = 20;
            const barSpacing = (chartW - 40) / 4;

            // Draw Y axis lines
            doc.setDrawColor(colors.gridLine[0], colors.gridLine[1], colors.gridLine[2]);
            doc.setLineWidth(0.5);
            // Draw axis line at bottom of chart
            doc.line(24, chartStartY + 38, width - 24, chartStartY + 38);

            chartData.forEach((bar, idx) => {
                const bx = 28 + idx * barSpacing;
                const pct = bar.val / maxCount;
                const barH = Math.max(pct * 28, 1); // min 1mm for drawing

                // Draw Bar
                doc.setFillColor(bar.col[0], bar.col[1], bar.col[2]);
                doc.roundedRect(bx, chartStartY + 38 - barH, barW, barH, 1, 1, 'F');

                // Value above bar
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(8.5);
                doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
                doc.text(String(bar.val), bx + barW / 2, chartStartY + 38 - barH - 2, { align: 'center' });

                // Label below bar
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
                doc.text(bar.label, bx + barW / 2, chartStartY + 42, { align: 'center' });
            });
            y += chartH + 10;

            // 3. Student Summary Table
            ensureSpace(50);
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("CANDIDATE PLACEMENT MATRIX", 14, y);
            y += 5;

            const studentSummaryRows = students.map(student => {
                const studentApps = applications.filter(app => {
                    const userId = app.user?._id || app.user;
                    const userEmail = app.user?.email;
                    return userId === student._id || (userEmail && userEmail === student.email);
                });

                const totalApps = studentApps.length;
                const selectedApps = studentApps.filter(a => a.status === 'Selected').length;
                const rejectedApps = studentApps.filter(a => a.status === 'Rejected').length;
                const interviews = studentApps.filter(a => a.status === 'Interview Scheduled').length;
                const sRate = totalApps > 0 ? `${Math.round((selectedApps / totalApps) * 100)}%` : '0%';

                return [
                    student.name || 'N/A',
                    student.email || 'N/A',
                    totalApps,
                    interviews,
                    selectedApps,
                    rejectedApps,
                    sRate
                ];
            });

            doc.autoTable({
                startY: y,
                head: [['Student Name', 'Email Address', 'Apps', 'Interviews', 'Selected', 'Rejected', 'Success Rate']],
                body: studentSummaryRows.length > 0 ? studentSummaryRows : [['No students registered', '', '', '', '', '', '']],
                theme: 'striped',
                headStyles: {
                    fillColor: colors.tableHeader,
                    textColor: colors.tableHeaderTxt,
                    fontStyle: 'bold',
                    fontSize: 8
                },
                bodyStyles: {
                    fillColor: colors.cardBg,
                    textColor: colors.text,
                    borderColor: colors.cardBorder,
                    fontSize: 7.5
                },
                alternateRowStyles: {
                    fillColor: isDark ? [28, 40, 61] : [255, 255, 255]
                },
                margin: { left: 14, right: 14 },
                willDrawPage: (data) => {
                    if (data.pageNumber > 1) {
                        const w = doc.internal.pageSize.getWidth();
                        const h = doc.internal.pageSize.getHeight();
                        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
                        doc.rect(0, 0, w, h, 'F');
                        drawReportHeader(doc, "Consolidated Report", "Placement Analytics", isDark);
                    }
                }
            });

            y = doc.lastAutoTable.finalY + 10;

            // 4. Top Companies & Most Applied Roles
            ensureSpace(40);
            
            const topCardW = (width - 28 - 6) / 2;
            const topCardH = 34;

            // Column A: Top Companies
            const companyCounts = {};
            applications.forEach(a => {
                const name = (a.companyName || 'Unknown').trim();
                companyCounts[name] = (companyCounts[name] || 0) + 1;
            });
            const topCompanies = Object.entries(companyCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4);

            doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
            doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
            doc.roundedRect(14, y, topCardW, topCardH, 2, 2, 'FD');

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("TOP RECRUITING COMPANIES", 18, y + 6);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            if (topCompanies.length === 0) {
                doc.text("No data logged", 18, y + 14);
            } else {
                topCompanies.forEach(([name, count], i) => {
                    doc.text(`${i+1}. ${name}`, 18, y + 14 + i * 5);
                    doc.text(`${count} apps`, 14 + topCardW - doc.getTextWidth(`${count} apps`) - 4, y + 14 + i * 5);
                });
            }

            // Column B: Most Applied Roles
            const roleCounts = {};
            applications.forEach(a => {
                const name = (a.role || 'Unknown').trim();
                roleCounts[name] = (roleCounts[name] || 0) + 1;
            });
            const topRoles = Object.entries(roleCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4);

            doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
            doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
            doc.roundedRect(14 + topCardW + 6, y, topCardW, topCardH, 2, 2, 'FD');

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("MOST APPLIED JOB ROLES", 18 + topCardW + 6, y + 6);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            if (topRoles.length === 0) {
                doc.text("No data logged", 18 + topCardW + 6, y + 14);
            } else {
                topRoles.forEach(([name, count], i) => {
                    doc.text(`${i+1}. ${name}`, 18 + topCardW + 6, y + 14 + i * 5);
                    doc.text(`${count} apps`, 14 + topCardW * 2 + 6 - doc.getTextWidth(`${count} apps`) - 4, y + 14 + i * 5);
                });
            }
            y += topCardH + 10;

            // 5. Placement Insights
            ensureSpace(32);
            doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
            doc.setDrawColor(colors.cardBorder[0], colors.cardBorder[1], colors.cardBorder[2]);
            doc.roundedRect(14, y, width - 28, 24, 2.5, 2.5, 'FD');

            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
            doc.text("OFFICIAL PLACEMENT INSIGHTS", 18, y + 6);

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);

            // Generate contextual insights
            const activePct = stats.totalApplications > 0 ? Math.round((stats.activeApplications / stats.totalApplications) * 100) : 0;
            const topCompStr = topCompanies.length > 0 ? topCompanies[0][0] : "N/A";
            const topRoleStr = topRoles.length > 0 ? topRoles[0][0] : "N/A";

            const insight1 = `- Active recruitment pipeline represents ${activePct}% of total logged applications, maintaining strong velocity.`;
            const insight2 = `- Success rate is at ${stats.successRate || 0}%, showing target conversions at top employers like ${topCompStr}.`;
            const insight3 = `- Most in-demand job role is ${topRoleStr}, showing strong alignment with engineering profiles.`;

            doc.text(insight1, 18, y + 12);
            doc.text(insight2, 18, y + 16.5);
            doc.text(insight3, 18, y + 21);

            finalizeDocument(doc, isDark);
            
            const cleanDate = new Date().toISOString().split('T')[0];
            doc.save(`Placement_Report_${cleanDate}.pdf`);
        },
        async triggerStudentDownload(studentId = null, btn = null) {
            let originalHTML = "";
            if (btn) {
                originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader-2" style="animation: spin 1s linear infinite; width: 14px; height: 14px; margin-right: 6px; display: inline-block; vertical-align: middle;"></i><span>Generating...</span>`;
                if (window.lucide) window.lucide.createIcons({ root: btn });
            }

            try {
                const token = localStorage.getItem("token");
                const headers = {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                };

                let student, applications, notes;

                if (studentId) {
                    // Fetch as admin
                    const base = `${window.APP_API_BASE}/admin/students/${studentId}`;
                    const resS = await fetch(base, { headers }).then(r => r.json());
                    const resA = await fetch(`${base}/applications`, { headers }).then(r => r.json());
                    const resN = await fetch(`${base}/notes`, { headers }).then(r => r.json());

                    if (!resS || !resS.success) throw new Error((resS && resS.message) || "Failed to fetch student details");
                    student = resS.data;
                    applications = resA && resA.success ? resA.data : [];
                    notes = resN && resN.success ? resN.data : [];
                } else {
                    // Fetch as student
                    const resS = await fetch(`${window.APP_API_BASE}/auth/profile`, { headers }).then(r => r.json());
                    const resA = await fetch(`${window.APP_API_BASE}/companies`, { headers }).then(r => r.json());
                    const resN = await fetch(`${window.APP_API_BASE}/notes`, { headers }).then(r => r.json());

                    if (!resS || !resS.success) throw new Error((resS && resS.message) || "Failed to fetch profile");
                    student = resS.data;
                    applications = resA && resA.success ? resA.data : (Array.isArray(resA) ? resA : []);
                    notes = resN && resN.success ? resN.data : (Array.isArray(resN) ? resN : []);
                }

                if (applications && applications.data) applications = applications.data;
                if (notes && notes.data) notes = notes.data;

                const theme = localStorage.getItem("theme") || "dark";
                await this.downloadStudentReport(student, applications, notes, theme);
                
                if (window.Toast) window.Toast.success("Success", "PDF Report downloaded successfully!");
            } catch (err) {
                console.error("PDF generation error:", err);
                if (window.Toast) window.Toast.error("Error", err.message || "Failed to generate PDF report");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                    if (window.lucide) window.lucide.createIcons({ root: btn });
                }
            }
        },

        async triggerConsolidatedDownload(btn = null) {
            let originalHTML = "";
            if (btn) {
                originalHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader-2" style="animation: spin 1s linear infinite; width: 14px; height: 14px; margin-right: 6px; display: inline-block; vertical-align: middle;"></i><span>Generating...</span>`;
                if (window.lucide) window.lucide.createIcons({ root: btn });
            }

            try {
                const token = localStorage.getItem("token");
                const headers = {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                };

                const resStats = await fetch(`${window.APP_API_BASE}/admin/stats`, { headers }).then(r => r.json());
                const resUsers = await fetch(`${window.APP_API_BASE}/admin/users`, { headers }).then(r => r.json());
                const resApps = await fetch(`${window.APP_API_BASE}/admin/applications`, { headers }).then(r => r.json());

                if (!resStats || !resStats.success) throw new Error((resStats && resStats.message) || "Failed to fetch platform statistics");
                const stats = resStats.data;
                const students = resUsers && resUsers.success ? resUsers.data : [];
                const applications = resApps && resApps.success ? resApps.data : [];

                const theme = localStorage.getItem("theme") || "dark";
                await this.downloadConsolidatedReport(stats, students, applications, theme);

                if (window.Toast) window.Toast.success("Success", "Consolidated placement report downloaded!");
            } catch (err) {
                console.error("PDF generation error:", err);
                if (window.Toast) window.Toast.error("Error", err.message || "Failed to generate consolidated report");
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                    if (window.lucide) window.lucide.createIcons({ root: btn });
                }
            }
        }
    };

    window.PdfGenerator = PdfGenerator;
})();
