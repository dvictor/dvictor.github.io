const MAX_SPEED = 80
const MAX_SINK = 3
// dimensions and margins of the graph
const margin = {top: 50, right: 150, bottom: 30, left: 50},
	width = 960 - margin.left - margin.right,
	height = 470 - margin.top - margin.bottom;

d3.select('#wind-speed').on('input', () => {
	setWindSpeed(+d3.event.target.value)
})

d3.selectAll('[name="glideName"]').on('change', () => {
	glideName = d3.event.target.value
	renderGraph()
})

let lesson = 1
function resetLesson() {
	d3.select('[name="glideName"][value="Best Glide"]').node().click()
	setWindSpeed(0)
}
const lessonAction = {
	1: () => {},
	2: () => {},
	3: () => {
		setWindSpeed(-15)
	},
	4: () => {
		setWindSpeed(15)
	},
	5: () => {
		setWindSpeed(22)
	},
}
d3.select('#next-btn').on('click', () => {
	if (lesson === 5) lesson = 0
	lesson += 1
	updLesson()
})
d3.select('#prev-btn').on('click', () => {
	if (lesson === 1) lesson = 6
	lesson -= 1
	updLesson()
})
function updLesson() {
	d3.select('.cases > div').style('margin-left', -300 * (lesson-1) + 'px')
	resetLesson()
	lessonAction[lesson]()
}

let glideName = 'Best Glide'


let windSpeed = 0

function setWindSpeed(speed) {
	windSpeed = speed
	d3.select('#wind-speed-num').text(windSpeed + 'Km/h')
	d3.select('#air-speed-box').text(`Wind Speed: ${windSpeed}Km/h`)
	d3.select('#wind-speed').node().value = speed
	renderGraph()
}


// array of curve functions and tites
const curveArray = [
	{"d3Curve": d3.curveCardinal, "curveTitle": "curveCardinal"},
	{"d3Curve": d3.curveMonotoneX, "curveTitle": "curveMonotoneX"},
	{"d3Curve": d3.curveCatmullRom, "curveTitle": "curveCatmullRom"}
];

// set the ranges
const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleLinear().range([0, height]);

const svg = d3.select("body > svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform",
		"translate(" + margin.left + "," + margin.top + ")");

let data = [
	{x: 26, y: 1.25, label: 'Stall Point'},
	{x: 28, y: 1.07},
	{x: 30, y: 1.02, label: 'Min Sink'},
	{x: 38, y: 1.173, label: 'Trim Speed'},
	{x: 45, y: 1.46},
	{x: 50, y: 1.85, label: 'Top Speed'}
]


x.domain([0, MAX_SPEED]);
y.domain([0, -MAX_SINK]);


svg.append("path")
	.attr('id', 'curve-path')
	.attr('class', 'line');

svg.append('path')
	.attr('id', 'tangent')
	.attr('class', 'line')

svg.append('text')
	.append('textPath')
	.attr('href', '#tangent')
	.attr('startOffset', '10%')
	.attr('id', 'tangent-text');

// Add the X Axis
svg.append("g")
	.attr("class", "axis")
	//.attr("transform", "translate(0," + height + ")")
	.call(d3.axisTop(x))
	.append('text')
		.attr('x', width + 10)
		.attr('y', -9)
		.attr('text-anchor', 'start')
		.text('Km/h Ground Speed')
svg.append('g')
	.attr('id', 'air-speed-axis')
	.attr('transform', 'translate(0, -30)')
	.attr('class', 'axis')
	.call(d3.axisTop(x))
	.append('text')
		.attr('x', width + 10)
		.attr('y', -9)
		.attr('text-anchor', 'start')
		.text('Km/h Air Speed')

// Wind Speed box
const gt = svg.append('g')
	.attr('transform', `translate(${width - 140}, 20)`)
gt.append('rect')
	.attr('width', 140)
	.attr('height', 22)
	.attr('class', 'air-speed-rect')
gt.append('text')
	.attr('id', 'air-speed-box')
	.attr('x', 70)
	.attr('y', 15)
	.attr('text-anchor', 'middle')
	.text('Wind Speed: 0Km/h')

// Add the Y Axis
svg.append("g")
	.attr("class", "axis")
	.call(d3.axisLeft(y));

function renderGraph() {

	d3.select('#air-speed-axis')
		.attr('transform', `translate(${x(windSpeed)}, -30)`)

	// format the data
	data.forEach(function (d) {
		d.xx = +d.x + windSpeed
		d.yy = - d.y;
	});

	const curve = d3.line()
		.curve(d3.curveMonotoneX)
		.x(d => x(d.xx))
		.y(d => y(d.yy))

	const curveEl = svg.select("#curve-path")
		.datum(data)
		.attr("d", curve)
		.node();

	const len = curveEl.getTotalLength()
	const segs = 500
	let p = {x: 0, y: 100}
	for (let i=0; i<segs+1; i++) {
		const pp = curveEl.getPointAtLength(len * i / segs)
		p = Math.atan2(pp.y, pp.x) > Math.atan2(p.y, p.x) ? p : pp
	}

	const data2 = [...data, {xx: x.invert(p.x), yy:y.invert(p.y), label: 'Best Glide', b: true}]

	const glideP = data2.find(d => d.label === glideName)

	const glideSpeed = glideP.xx
	const glide = - glideSpeed / (glideP.yy * 3.6)
	svg.select('#tangent-text')
		.text('Glide: ' + glide.toFixed(1) + ':1 at ' + glideSpeed.toFixed(1) + 'Km/h')

	const sc = 1.3
	svg.select('path#tangent')
		.attr('d', `m0,0 l${x(glideP.xx) * sc},${y(glideP.yy) * sc}`)


	// Add the scatterplot
	svg.selectAll('circle').remove()
	svg.selectAll("circle")
		.data(data2).enter()
		.filter(d => d.label)
		.append("circle")
		.attr("r", 3)
		.attr("cx", d => x(d.xx))
		.attr("cy", d => y(d.yy))
		.attr('style', d => d.b ? 'fill: red' : '');

	svg.selectAll('text.label').remove()
	svg.selectAll('labels')
		.data(data2).enter()
		.append('text')
		.attr('class', 'label')
		.attr('x', d => x(d.xx))
		.attr('y', d => y(d.yy) + (d.b ? -15 : 20))
		.attr('text-anchor', 'middle')
		.attr('style', d => d.b ? 'fill: red' : '')
		.text(d => d.label)
}

renderGraph();