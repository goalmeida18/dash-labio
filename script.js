let wordsMovedToCards = false;
const originalPositions = new Map();
const originalParents = new Map();
const originalNextSiblings = new Map();
const targetPositions = new Map();
const keywords = [];

document.addEventListener('DOMContentLoaded', () => {
    const keywordElements = document.querySelectorAll('.keyword');
    keywordElements.forEach((keyword, index) => {
        const rect = keyword.getBoundingClientRect();
        originalPositions.set(keyword.id, { top: rect.top + window.scrollY, left: rect.left + window.scrollX });
        originalParents.set(keyword.id, keyword.parentNode);
        originalNextSiblings.set(keyword.id, keyword.nextSibling);
        keywords.push(keyword);
    });

    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        targetPositions.set(`keyword${index + 1}`, { top: rect.top + window.scrollY, left: rect.left + window.scrollX });
    });

    window.addEventListener('scroll', updatePositions);
    createTreemap(); // Chame a função para criar o treemap
});

function updatePositions() {
    const scrollY = window.scrollY;
    const triggerPoint = 50; // Inicia o efeito quando 50px da página foi rolada

    if (scrollY >= triggerPoint && !wordsMovedToCards) {
        document.getElementById('keywords').style.opacity = 1;
        keywords.forEach((keyword, index) => {
            moveToCard(keyword, `card${index + 1}`);
        });
        wordsMovedToCards = true;
    } else if (scrollY < triggerPoint && wordsMovedToCards) {
        document.getElementById('keywords').style.opacity = 0;
        keywords.forEach((keyword) => {
            moveBackToText(keyword);
        });
        wordsMovedToCards = false;
    }
}

const moveToCard = (keyword, cardId) => {
    const card = document.getElementById(cardId);
    const keywordRect = keyword.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    // Salvar a posição, pai e próximo irmão original
    if (!originalPositions.has(keyword.id)) {
        originalPositions.set(keyword.id, {
            top: keywordRect.top + window.scrollY,
            left: keywordRect.left + window.scrollX
        });
        originalParents.set(keyword.id, keyword.parentNode);
        originalNextSiblings.set(keyword.id, keyword.nextSibling);
    }

    const dx = cardRect.left - keywordRect.left;
    const dy = cardRect.top - keywordRect.top;

    keyword.style.transform = `translate(${dx}px, ${dy}px)`;
    keyword.style.position = 'absolute';

    keyword.addEventListener('transitionend', function transitionEnd() {
        keyword.classList.add('keyword-card');
        card.appendChild(keyword);
        keyword.style.position = 'static';
        keyword.style.transform = 'none';
        keyword.removeEventListener('transitionend', transitionEnd);
    });
};

const moveBackToText = (keyword) => {
    const originalParent = originalParents.get(keyword.id);
    const originalNextSibling = originalNextSiblings.get(keyword.id);
    const originalRect = originalPositions.get(keyword.id);

    if (!originalRect || !originalParent) return;

    const currentRect = keyword.getBoundingClientRect();
    const dx = originalRect.left - currentRect.left;
    const dy = originalRect.top - currentRect.top;

    keyword.classList.remove('keyword-card');
    keyword.style.transform = `translate(${dx}px, ${dy}px)`;
    keyword.style.position = 'absolute';

    originalParent.insertBefore(keyword, originalNextSibling);

    requestAnimationFrame(() => {
        keyword.style.transform = 'none';
        keyword.style.position = 'relative';
    });
};

// Inicializar o mapa
const map = L.map('map').setView([-18.512178, -44.555031], 6); // Coordenadas e zoom inicial

// Adicionar camada de mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Definir uma função de estilo para as mesorregiões
function getColor(id) {
    // Defina um conjunto de cores diferentes para as regiões
    const colors = [
        '#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', 
        '#FC4E2A', '#E31A1C', '#BD0026', '#800026'
    ];
    return colors[id % colors.length];
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.id),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// Função para configurar os eventos em cada feature
function onEachFeature(feature, layer) {
    if (feature.properties) {
        const popupContent = `<b>${feature.properties.nm_meso}</b><br>Empresários Entrevistados: ${feature.properties.entrevistados}`;
        layer.bindTooltip(popupContent, { permanent: false, direction: 'top' });
    }
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
}

function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

// Adicionar mesorregiões de Minas Gerais
let geojson;
fetch('mapa/geojson.json')  // Caminho correto do arquivo GeoJSON
    .then(response => response.json())
    .then(data => {
        geojson = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    });

// Criar o mapa de árvore
function createTreemap() {
    const data = {
        name: "root",
        children: [
            { name: "Comercio; reparação de veículos automotores e motocicletas", value: 675 },
            { name: "Atividades profissionais, científicas e técnicas", value: 278 },
            { name: "Saúde Humana e Serviços sociais", value: 180 },
            { name: "Alojamento e alimentação", value: 151 },
            { name: "Atividades administrativa e serviços complementares", value: 150 },
            { name: "Industriais de transformação", value: 122 },
            { name: "Educação", value: 83 },
            { name: "Informação e comunicação", value: 71 },
            { name: "Construção", value: 63 },
            { name: "Outras atividades de serviços", value: 54 },
            { name: "Atividades imobilárias", value: 49 },
            { name: "Transporte, armazenagem e correio", value: 45 },
            { name: "Artes, Cultura, Esporte e Recreação", value: 41 }
        ]
    };

    const width = document.getElementById('tree').clientWidth;
    const height = document.getElementById('tree').clientHeight;

    const treemapLayout = d3.treemap()
        .size([width, height])
        .padding(2);

    const root = d3.hierarchy(data)
        .sum(d => d.value);

    treemapLayout(root);

    const maxVal = d3.max(root.leaves(), d => d.value);
    const colorScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range(["#d3d3d3", "#00008b"]); // Escala de cinza a azul escuro

    const nodes = d3.select('#tree')
        .selectAll('div')
        .data(root.leaves())
        .enter()
        .append('div')
        .attr('class', 'node')
        .style('left', d => `${d.x0}px`)
        .style('top', d => `${d.y0}px`)
        .style('width', d => `${d.x1 - d.x0}px`)
        .style('height', d => `${d.y1 - d.y0}px`)
        .style('background', d => colorScale(d.value))
        .on('mouseover', function(event, d) {
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.75)')
                .style('color', 'white')
                .style('padding', '5px')
                .style('border-radius', '3px')
                .style('pointer-events', 'none')
                .style('transform', 'translate(-50%, -100%)')
                .style('left', `${event.pageX}px`)
                .style('top', `${event.pageY - 20}px`)
                .text(`${d.data.name}: ${d.data.value}`);

            d3.select(this).style('border', '2px solid #666');

            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
        })
        .on('mousemove', function(event) {
            d3.select('.tooltip')
                .style('left', `${event.pageX}px`)
                .style('top', `${event.pageY - 20}px`);
        })
        .on('mouseout', function() {
            d3.select('.tooltip').remove();
            d3.select(this).style('border', '1px solid #fff');
        });

    nodes.append('div')
        .attr('class', 'node-label')
        .text(d => `${d.data.name}`);
}
