$(function () {
    // iniciar o ScrollMagic Controller
    var controller = new ScrollMagic.Controller();

    // definir o movimento dos painéis
    var wipeAnimation = new TimelineMax()
        // animar até o segundo painel
        .to("#slideContainer", 1, {z: -150})    // mover para trás no espaço 3D
        .to("#slideContainer", 1,   {x: "-25%"})  // mover para o segundo painel
        .to("#slideContainer", 1, {z: 0})       // voltar à origem no espaço 3D
        // animar até o terceiro painel
        .to("#slideContainer", 1, {z: -150})
        .to("#slideContainer", 1,   {x: "-50%"})
        .to("#slideContainer", 1, {z: 0})
        // animar até o quarto painel
        .to("#slideContainer", 1, {z: -150})
        .to("#slideContainer", 1,   {x: "-75%"})
        .to("#slideContainer", 1, {z: 0})
        .to("#slideContainer", 1.2, {z: 0})

    // criar a cena para fixar e ligar a animação
    new ScrollMagic.Scene({
            triggerElement: "#pinContainer",
            triggerHook: 0,
            duration: "800%" // Duração ajustada para 400% da altura da viewport
        })
        .setPin("#pinContainer", {pushFollowers: false}) // Previne empurrar conteúdo adicional para baixo
        .setTween(wipeAnimation)
        .addIndicators() // adiciona indicadores (requer o plugin)
        .addTo(controller);

    createTreemap();
});

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


function createTreemap() {
        const data = {
            name: "root",
            children: [
                { name: "Comercio; reparação de veículos", value: 519 },
                { name: "Atividades profissionais, científicas e técnicas", value: 326 },
                { name: "Outras atividades de serviços", value: 227 },
                { name: "Alojamento e alimentação", value: 188 },
                { name: "Saúde Humana e Serviços sociais", value: 166 },
                { name: "Informação e comunicação", value: 123 },
                { name: "Construção", value: 73 },
                { name: "Atividades administrativa", value: 72 },
                { name: "Artes, Cultura, Esporte e Recreação", value: 48 },
                { name: "Industriais de transformação", value: 46 },
                { name: "Atividades imobilárias", value: 40 },
                { name: "Educação", value: 39 },
                { name: "Transporte, armazenagem e correio", value: 27 },
                { name: "Eletricidade e gás", value: 24 },
                { name: "Atividades financeiras", value: 20 },
                { name: "Agricultura, pecuária, produção florestas", value: 18 },
                { name: "Sem identificação", value: 10 },
                { name: "Água, esgoto, gestão de resíduos", value: 8 },
                { name: "Administração publica", value: 3 },
                { name: "Industriais Extrativas", value: 3 },
                { name: "Organismo internacional", value: 2 },
                { name: "Serviços domésticos", value: 1 }
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
