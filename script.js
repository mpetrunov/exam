function calculateMetrics() {
    // Get inputs
    const revenue = parseFloat(document.getElementById('revenue').value) || 0;
    const orderValue = parseFloat(document.getElementById('orderValue').value) || 1;
    const leadRate = parseFloat(document.getElementById('leadRate').value);
    const prospectRate = parseFloat(document.getElementById('prospectRate').value);

    // Set CSS custom properties for slider track shading
    document.getElementById('leadRate').style.setProperty('--val', leadRate + '%');
    document.getElementById('prospectRate').style.setProperty('--val', prospectRate + '%');

    // Update labels for sliders
    document.getElementById('leadRateLabel').innerText = leadRate.toFixed(2) + '%';
    document.getElementById('prospectRateLabel').innerText = prospectRate.toFixed(2) + '%';

    // Core Calculations based on reverse funnel strategy
    let customers = revenue / orderValue; // Total Customers needed
    let leads = customers / (leadRate / 100);
    let prospects = leads / (prospectRate / 100);

    // Apply Math.round to match picture display for cards
    let c = Math.round(customers);
    let l = Math.round(leads);
    let p = Math.round(prospects);

    // Update Text
    document.getElementById('prospectVal').innerText = p;
    document.getElementById('leadVal').innerText = l;
    document.getElementById('customerVal').innerText = c;

    // Update Percentages (relative to top of funnel - Prospects is 100%)
    const pPercent = 100;
    const lPercent = p > 0 ? Math.round((l / p) * 100) : 0;
    const cPercent = p > 0 ? Math.round((c / p) * 100) : 0;

    document.getElementById('prospectPercent').innerText = pPercent + '%';
    document.getElementById('leadPercent').innerText = lPercent + '%';
    document.getElementById('customerPercent').innerText = cPercent + '%';

    // Update Progress Bars
    document.getElementById('prospectFill').style.width = pPercent + '%';
    document.getElementById('leadFill').style.width = lPercent + '%';
    document.getElementById('customerFill').style.width = cPercent + '%';

    // Calculate months difference
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let activeMonths = 6;
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            activeMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            if (activeMonths <= 0) activeMonths = 1;
        }
    }
    
    let gridMonths = activeMonths < 6 ? 6 : activeMonths;

    // Render Chart
    renderChart(p, l, c, activeMonths, gridMonths);
}

function renderChart(totalProspects, totalLeads, totalCustomers, activeMonths, gridMonths) {
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // clear

    // Config
    let maxX = totalProspects > 0 ? totalProspects : 100;
    
    // Scale limits by jumping in powers of 10 and doubling within them (120->240->480->960 => 1200->2400...)
    let m = 1;
    let axisLimit = 120;
    while(true) {
        if (maxX <= 120 * m) { axisLimit = 120 * m; break; }
        if (maxX <= 240 * m) { axisLimit = 240 * m; break; }
        if (maxX <= 480 * m) { axisLimit = 480 * m; break; }
        if (maxX <= 960 * m) { axisLimit = 960 * m; break; }
        m *= 10;
    }

    // Helper for translations inside chart
    const tMonths = window.currentLanguage === 'bg' ? 'Месеци' : 'Months';
    const tPeople = window.currentLanguage === 'bg' ? 'души' : 'people';

    // Chart Area structure
    
    let html = `
        <div class="y-axis-title">${tMonths}</div>
        <div class="chart-grid">
            ${Array.from({length: 7}).map((_, i) => '<div class="grid-line-vertical"></div>').join('')}
        </div>
        <div class="chart-grid-horizontal">
            ${Array.from({length: gridMonths}).map((_, i) => '<div class="grid-line-horizontal"></div>').join('')}
        </div>
        <div class="y-axis">
            ${Array.from({length: gridMonths}).map((_, i) => `<span>${i + 1}</span>`).join('')}
        </div>
        <div class="x-axis">
            ${Array.from({length: 7}).map((_, i) => `
                <div class="x-tick-group">
                    <div class="x-tick"></div>
                    <span>${Math.round(i * (axisLimit / 6))} ${tPeople}</span>
                </div>
            `).join('')}
        </div>
        <div class="tooltip" id="chart-tooltip"></div>
    `;

    // Process each month incrementally (showing cumulative pipeline)
    for (let i = 1; i <= gridMonths; i++) {
        if (i <= activeMonths) {
            // Growth factor - linear accumulation as in standard models mapping to end goal
            let factor = i / activeMonths;
            let p = Math.round(totalProspects * factor);
            let l = Math.round(totalLeads * factor);
            let c = Math.round(totalCustomers * factor);

            // Convert values to percentages of chart width
            let pWidth = (p / axisLimit) * 100;
            let lWidth = (l / axisLimit) * 100;
            let cWidth = (c / axisLimit) * 100;

            html += `
                <div class="chart-row" 
                     onmousemove="showTooltip(event, ${i}, ${p}, ${l}, ${c})" 
                     onmouseleave="hideTooltip()">
                    <div class="bar bar-prospects" style="width: ${pWidth}%;"></div>
                    <div class="bar bar-leads" style="width: ${lWidth}%;"></div>
                    <div class="bar bar-customers" style="width: ${cWidth}%;"></div>
                </div>
            `;
        } else {
            html += `<div class="chart-row"></div>`;
        }
    }

    container.innerHTML = html;
}

function showTooltip(e, month, p, l, c) {
    const tooltip = document.getElementById('chart-tooltip');
    if(!tooltip) return;
    tooltip.innerHTML = `Month #${month}
Prospects: ${p}
Leads: ${l}
Customers: ${c}`;
    tooltip.style.display = 'block';
    
    // Position tracking mouse
    const chartRect = document.getElementById('chart-container').getBoundingClientRect();
    const x = e.clientX - chartRect.left + 15;
    const y = e.clientY - chartRect.top + 15;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

function hideTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    if(tooltip) tooltip.style.display = 'none';
}

// Initial Run
window.addEventListener('DOMContentLoaded', calculateMetrics);

function updateCurrencySymbol(symbol) {
    const symbols = document.querySelectorAll('.currency-symbol');
    symbols.forEach(el => {
        el.innerText = symbol;
    });
}

// Language Translation Logic
window.currentLanguage = 'en';

const translations = {
    'bg': {
        'Language': 'Език',
        'Currency': 'Валута',
        'Campaign Start': 'Начало на кампания',
        'Campaign End': 'Край на кампания',
        'Total Revenue': 'Общи приходи',
        'Avg. Order Value': 'Средна поръчка',
        'Prospects': 'Контакти',
        'Leads': 'Потенциални Клиенти',
        'Customers': 'Клиенти',
        'Lead Response Rate': 'Oтговори от Потенциални Клиенти',
        'Prospect Response Rate': 'Отговори от Контакти',
        'Months': 'Месеци',
        'people': 'души'
    }
};

function changeLanguage(lang) {
    window.currentLanguage = lang;
    const isBg = lang === 'bg';
    const dict = translations['bg'];

    // Translate Labels
    document.querySelectorAll('label').forEach(label => {
        if (!label.dataset.en) label.dataset.en = label.innerText.trim();
        const key = label.dataset.en;
        label.innerText = (isBg && dict[key]) ? dict[key] : key;
    });

    // Translate Card Headers
    document.querySelectorAll('.stat-header h3').forEach(h3 => {
        if (!h3.dataset.en) h3.dataset.en = h3.innerText.trim();
        const key = h3.dataset.en;
        h3.innerText = (isBg && dict[key]) ? dict[key] : key;
    });

    // Re-render chart to apply translations to chart elements
    calculateMetrics();
}
