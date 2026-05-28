function calculateMetrics() {
    // Get inputs
    const revenue = parseFloat(document.getElementById('revenue').value) || 0;
    const orderValue = parseFloat(document.getElementById('orderValue').value) || 1;
    const leadRate = parseFloat(document.getElementById('leadRate').value);
    const prospectRate = parseFloat(document.getElementById('prospectRate').value);

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

    // Render Chart
    renderChart(p, l, c);
}

function renderChart(totalProspects, totalLeads, totalCustomers) {
    const container = document.getElementById('chart-container');
    container.innerHTML = ''; // clear

    // Config
    const months = 6;
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

    // Chart Area structure
    
    let html = `
        <div class="y-axis-title">Months</div>
        <div class="chart-grid">
            ${Array.from({length: 7}).map((_, i) => '<div class="grid-line-vertical"></div>').join('')}
        </div>
        <div class="chart-grid-horizontal">
            ${Array.from({length: months}).map((_, i) => '<div class="grid-line-horizontal"></div>').join('')}
        </div>
        <div class="y-axis">
            ${Array.from({length: months}).map((_, i) => `<span>${i + 1}</span>`).join('')}
        </div>
        <div class="x-axis">
            ${Array.from({length: 7}).map((_, i) => `
                <div class="x-tick-group">
                    <div class="x-tick"></div>
                    <span>${Math.round(i * (axisLimit / 6))} people</span>
                </div>
            `).join('')}
        </div>
        <div class="tooltip" id="chart-tooltip"></div>
    `;

    // Process each month incrementally (showing cumulative pipeline)
    for (let i = 1; i <= months; i++) {
        // Growth factor - linear accumulation as in standard models mapping to end goal
        let factor = i / months;
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
