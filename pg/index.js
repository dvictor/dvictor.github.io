const MAX_SPEED = 80
const MAX_SINK = 2
// dimensions and margins of the graph
const margin = {top: 70, right: 150, bottom: 30, left: 40},
	width = 960 - margin.left - margin.right,
	height = 350 - margin.top - margin.bottom;

d3.select('#wind-speed').on('input', () => {
	setWindSpeed(+d3.event.target.value)
})

d3.selectAll('[name="glideName"]').on('change', () => {
	glideName = d3.event.target.value
	renderGraph()
})

let lesson = 1
function resetLesson() {
	glideName = 'Best Glide'
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
	const w = d3.select('.cases').node().clientWidth
	d3.select('.cases > div').style('margin-left', -w * (lesson-1) + 'px')
	resetLesson()
	lessonAction[lesson]()
}

let unit = 'Km/h'
function setUnit(u) {
	unit = u
	renderAxes()
	renderGlideText()
	updateSpeedsInTexts()
}
function cs(kph) {
	return (unit === 'Km/h' ? kph : kph * 0.621371).toFixed(1)
}

let glideName = 'Best Glide'


let windSpeed = 0

function setWindSpeed(speed) {
	windSpeed = speed
	d3.select('#wind-speed-box').text(`Wind Speed: ${cs(windSpeed)} ${unit}`)
	d3.select('#wind-speed').node().value = cs(windSpeed)
	posAirspeedAxis()
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
x.domain([0, MAX_SPEED]);
y.domain([0, -MAX_SINK]);

const svg = d3.select("#svg")
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

function renderAxes() {

	d3.select('#axis-g').remove()
	const g = svg.append('g').attr('id', 'axis-g')
	// Add the X Axis
	g.append("g")
		.attr("class", "axis")
		//.attr("transform", "translate(0," + height + ")")
		.call(d3.axisTop(x).tickFormat(cs))

	g.append('g')
		.attr('id', 'air-speed-axis')
		.attr('transform', 'translate(0, -30)')
		.attr('class', 'axis')
		.call(d3.axisTop(x).tickFormat(cs))

	g.append('rect')
		.attr('x', width + 12)
		.attr('y', -50)
		.attr('width', 200)
		.attr('height', 100)
		.attr('fill', '#fff')
	g.append('text')
		.attr('x', width + 15)
		.attr('y', -29)
		.attr('text-anchor', 'start')
		.text(`${unit} Air Speed`)
	g.append('text')
		.attr('x', width + 15)
		.attr('y', -9)
		.attr('text-anchor', 'start')
		.text(`${unit} Ground Speed`)

	d3.select('#wind-speed-box').text(`Wind Speed: ${cs(windSpeed)} ${unit}`)

	// Add the Y Axis
	g.append("g")
		.attr("class", "axis")
		.call(d3.axisLeft(y));

	posAirspeedAxis();
}

svg.on('click', e => {
	const t = d3.select(d3.event.target)
	if (t.classed('label')) {
		glideName = d3.event.target?.firstChild.nodeValue
		renderGraph()
	}
})
d3.select('.kph-btn').on('click', () => {
	setUnit('Km/h')
})
d3.select('.mph-btn').on('click', () => {
	setUnit('mph')
})

renderAxes()

function posAirspeedAxis() {
	d3.select('#air-speed-axis')
		.attr('transform', `translate(${x(windSpeed)}, -30)`)
}

let glideSpeed = 0
let glideRatio = 0

function renderGraph() {

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

	glideSpeed = glideP.xx
	glideRatio = - glideSpeed / (glideP.yy * 3.6)
	renderGlideText()

	const sc = 1.3
	svg.select('path#tangent')
		.attr('d', `m0,0 l${x(glideP.xx) * sc},${y(glideP.yy) * sc}`)
		.classed('red', glideName === 'Best Glide')


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

function renderGlideText() {
	svg.select('#tangent-text')
		.text('Glide: ' + glideRatio.toFixed(1) + ':1 at ' + cs(glideSpeed) + ' ' + unit)
}

renderGraph();

// initConvertSpans
d3.selectAll('.convert-speed').each(function () {
	const el = this
	el.dataset.value = el.innerText.split(' ')[0]
})

function updateSpeedsInTexts() {
	d3.selectAll('.convert-speed').each(function () {
		const el = this
		el.innerText = cs(Number(el.dataset.value)) + ' ' + unit
	})
}
