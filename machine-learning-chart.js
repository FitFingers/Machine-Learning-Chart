const GRAPH = document.getElementById("main-graph"),
      GRAPH_X = 600,
      GRAPH_Y = 600,
      RANDOM_WEIGHTS = {
        x: randomNumber(-1, 1),
        y: randomNumber(-1, 1),
        offset: randomNumber(-1, 1) * GRAPH_X
      };

// If this was live, I would store the trainedWeights variable on the server-side so that it would always improve through user input and not restart every time the page refreshes. I don't know yet how I would deal with converging multiple user's data.
let trainedWeights = RANDOM_WEIGHTS,
    batchSize = 200,
    count = 0,
    graphType = "x-is-y",
    interval = -50,
    summary = [];


function setGraphSize() {
  GRAPH.style.width = "100%";
  GRAPH.style.height = document.getElementById("graph-box").offsetWidth;
}

// First, we have to generate an array of any length. This will be our data set, so the more data, the more accurate our AI will be. We need to set the elements in this array to equal random co-ordinates, so we can use the function randomNumber to generate these (as well as converting them to fit correctly into the graph) and return to each element an object.
function randomNumber(low, high) {
  return Math.random() * (high - low) + low;
}

function generateDataRange(limit) {
  const RANGE = [...Array(parseInt(limit)).keys()].map(p =>{
    return {
      x: randomNumber(-1, 1) * GRAPH_X/2 + GRAPH_X/2,
      y: randomNumber(-1, 1) * GRAPH_Y/2 + GRAPH_Y/2
    }});
  return RANGE;
}

function setInterval() {
  interval = event.target.value;
}

function updateGraphType(e) {
  graphType = e.target.id;
  resetVars();
  plotLine(graphType);
}

function plotLine(type) {
  [...GRAPH.getElementsByClassName("bisector")].map(l => l.parentNode.removeChild(l));
  type === "x-is-minus-y" ?
    renderLine(10, GRAPH_X-10, 10, GRAPH_Y-10) :
  type === "x-is-y" ?
    renderLine(10, GRAPH_X-10, GRAPH_Y-10, 10) :
  type === "x-is-y-sq" ?
    console.log("x = y²") : console.log("y = x²");
}

function renderLine(x1, x2, y1, y2) {
  const LINE = document.createElementNS("http://www.w3.org/2000/svg", "line");
  LINE.setAttribute("x1", x1);
  LINE.setAttribute("x2", x2);
  LINE.setAttribute("y1", y1);
  LINE.setAttribute("y2", y2);
  LINE.setAttribute("stroke", "green");
  LINE.classList.add("bisector");
  GRAPH.appendChild(LINE);
}

// Could be useful to have the object carry this information inside of it rather than calling it in the case that I need the result.
function correctAnswer(p) {
  return graphType === "x-is-minus-y" ?
    p.x > p.y ? 1 : -1 :
  p.x + p.y > GRAPH_X ? 1 : -1;
}

function getOffset() {
  return graphType === "x-is-minus-y" ? 0 : GRAPH_X;
}

// This is where we need to start using our RANDOM_WEIGHTS that we defined in the runFunction function. This is essentially the AI's initial bias toward something and it is totally random, but by training it with data and incrementing its bias/weight toward a certain result, it can learn and basically script its own algorithm to identify the correct outcome.
// The first part, takeGuess, will use the given weights (first time is random, after that is is always improving) to determine whether a point ought to be red or blue, which it returns as either 1 or -1. The trainOnce function then compares that to the correct team, and assigns the value of either 0 or -2 to ERROR. When the TRAINED_WEIGHTS object is declared, it adjusts the previous weights accordingly; these will then be passed into the next iteration to be honed further.
function trainOnce(weights, point, correct) {
  const GUESS = takeGuess(weights, point),
        ERROR = correct - GUESS,
        LEARNING_RATE = count < 2 ?
        0.01 : count < 4 ?
        0.001 : count < 6 ?
        0.0005 : count < 8 ?
        0.0002 : 0.00005,
        // This declaration keeps the weights the same when they map a point correctly, and alters them slightly when they map badly:
        // I would love to figure out how to remove the getOffset function. Giving the AI a clear 0 or 800 number depending on its situation feels like cheating but I can't figure out how to balance it to work for both graphs.
        TRAINED_WEIGHTS = {
          x: weights.x + (point.x * ERROR * LEARNING_RATE),
          y: weights.y + (point.y * ERROR * LEARNING_RATE),
          offset: weights.offset - (getOffset() * ERROR * LEARNING_RATE)
        };
  return TRAINED_WEIGHTS;
}

function takeGuess(weights, point) {
  const SUM =
        (weights.x * point.x) +
        (weights.y * point.y) - weights.offset;
  const GUESS = SUM > 0 ? 1 : -1;
  return GUESS;
}

function trainRange(data, weights, getCorrect, render) {
  for (let i = 0; i < data.length; i++) {
    trainedWeights = trainOnce(trainedWeights, data[i], getCorrect(data[i]));
    render([data[i]], trainedWeights);      // << HERE HAS A FEW STRAYS BUT IS *ALWAYS* ON THE CORRECT LINE. IT IS MUCH BETTER FOR TROUBLESHOOTING OTHER GRAPH TANGENTS.
  }
  // render(data, trainedWeights);       // << HERE WE HAVE NO STRAYS BUT SOMETIMES DEVIATE SUBSTANTIALLY FROM THE LINE. render IS A CALLBACK SO I CAN REUSE THIS FUNCTION ELSEWHERE.
}

function renderData(data, weights) {
  data.map(p => {
    const POINT = document.createElementNS("http://www.w3.org/2000/svg", "circle"),
          COLOUR = takeGuess(weights, p) === 1 ? "red" : "blue";
    POINT.setAttribute("cx", p.x);
    POINT.setAttribute("cy", p.y);
    POINT.setAttribute("r", 4);
    POINT.setAttribute("fill", COLOUR);
    GRAPH.appendChild(POINT);
  });
}

// This simply logs how many of the points are incorrectly placed. Average is around 0.5% with large batches (b > 200)
function checkSuccess(batchSize) {
  const TOF = [...document.getElementsByTagName("circle")].map(c => {
    const C = {
      x: parseFloat(c.getAttribute("cx")),
      y: parseFloat(c.getAttribute("cy"))
    };
    const CORR_COL = correctAnswer(C) === 1 ? "red" : "blue";
    return CORR_COL === c.getAttribute("fill");
  });
  FALSIES = TOF.filter(elem => elem === false).length;
  return {
    iteration: count,
    score: FALSIES,                     // BUG!: score is always 0 for some reason.
    batchSize: parseInt(batchSize),
    totalPoints: batchSize*count
  };
}

// This function simply logs the results into the summary array, which I will later use to convey the AI's learning curve through another graph.
function logResults(i) {
  if (i["score"] <= 0.055 && i["iteration"] <= 100) {
    console.log(`Success at ${i["iteration"]} with ${i["score"]}/${i["batchSize"]} fails.`);
    summary.push(i);
    resetVars();
    renderLastResult();
    return;
  } else if (i["iteration"] <= 100) {
    setTimeout(runFunction, interval);
  } else {
    console.log("Failure.")
    summary.push[i];
    resetVars();
    renderLastResult();
  }
}

function resetVars() {
  count = 0;
  trainedWeights = RANDOM_WEIGHTS;
}

function renderLastResult() {
  document.getElementById("result-display").value = JSON.stringify(summary[summary.length-1]);
}

// Using a count variable, I will scale down the learning rate as the results get more precise so as to fine-tune the AI.
function runFunction() {
  setGraphSize();
  batchSize = document.getElementById("batch-size").value || 50;
  [...document.getElementsByTagName("circle")].map(c => c.parentNode.removeChild(c));
  plotLine(graphType);
  const DATA = generateDataRange(batchSize);
  trainRange(DATA, trainedWeights, correctAnswer, renderData);
  count++;

  const ITERATION = checkSuccess(batchSize);
  logResults(ITERATION);
}



// NEXT FEATURE: Give the user a learning-rate display and input box (maybe use [...args] where each arg = [learning-rate, count] so as to keep the sliding scale).

// NEXT FEATURE: Design a graph which uses the objects stored in array "summary" and plots them to a graph to visualise the entire process.

// NEXT FEATURE: Add options to change the maximum iteration count.

// NEXT FEATURE: Function to choose whether to reset weights on win/failure or keep training this data.

// NEXT FEATURE: Customise colours function.






[...document.getElementsByClassName("graph-button")].map(b => b.addEventListener("click", updateGraphType));
[...document.getElementsByClassName("unfinished")].map(b => b.addEventListener("click", () => alert("Pfft, you know how difficult the other graphs were?!")));
document.getElementById("new-speed").addEventListener("input", setInterval);
document.getElementById("batch-size").addEventListener("input", resetVars);
document.getElementById("run-function").addEventListener("click", runFunction);

window.addEventListener("keypress", (e) => { if (e.keyCode == 13) { runFunction() }});
window.onresize = () => setGraphSize();
window.onload = () => runFunction();
