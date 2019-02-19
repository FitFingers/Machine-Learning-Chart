const GRAPH = document.getElementById("main-graph"),
      GRAPH_X = 600,
      GRAPH_Y = 600;

// If this was live, I would store the trainedWeights variable on the server-side so that it would always improve through user input and not restart every time the page refreshes. I don't know yet how I would deal with converging multiple user's data.
let randomWeights = generateRandomWeights(),
    trainedWeights = randomWeights,
    iterationCount = 0,
    batchSize = 50,
    maxIterations = 10,
    learningRate = [[2, 0.01], [4, 0.001], [6, 0.0005], [8, 0.0002]],
    learnRateCount = 0,
    accuracyTarget = 99,
    shouldWeightsReset = true,
    interval = 0,
    shouldRenderAfterPoint = true,
    graphType = "x-is-y",
    isHelpOpen = false,
    isSummaryOpen = false,
    summary = [];



function generateRandomWeights() {
  return ({
    x: randomNumber(-1, 1),
    y: randomNumber(-1, 1),
    offset: randomNumber(-1, 1) * GRAPH_X
  });
}

function setRandomWeights() {
  randomWeights = generateRandomWeights();
}

function setGraphSize() {
  GRAPH.style.width = "100%";
  GRAPH.style.height = document.getElementById("graph-box").offsetWidth;
}

function toggleSwitch() {
  const IS_TOGGLE_ON = this.classList.contains("toggleOn");
  IS_TOGGLE_ON === true ?
    this.classList.remove("toggleOn") :
  this.classList.add("toggleOn");
  handleToggleChange(this.id, IS_TOGGLE_ON);
}

function handleToggleChange(e, isToggleOn) {
  const TEXT_VALUES = {
    "weight-reset-toggle": {
      true: "Forget",
      false: "Learn",
    },
    "point-iteration-toggle": {
      true: "Point",
      false: "Batch",
    }
  }
  document.getElementById(e).innerHTML = TEXT_VALUES[e][isToggleOn];

  e === "weight-reset-toggle" ?
    shouldWeightsReset = !shouldWeightsReset :
  shouldRenderAfterPoint = !shouldRenderAfterPoint;
}

// I would love to figure out how to make this one "setVariable(var)" function where I pass in the variable as a string and set that variable to equal this.value.
// Look into eval() and window[var].
function setBatchSize() {
  batchSize = parseInt(this.value);
}

function setMaxIterations() {
  maxIterations = parseInt(this.value);
}

function setAccuracyTarget() {
  accuracyTarget = parseInt(this.value);
}

function setInterval() {
  interval = parseInt(this.value);
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
    console.log("'x = y²' is coming soon") : console.log("'y = x²' is coming soon");
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

// First, we have to generate an array of any length. This will be our data set, so the more data, the more accurate our AI will be. We need to set the elements in this array to equal random co-ordinates, so we can use the function randomNumber to generate these (as well as converting them to fit correctly into the graph) and return to each element an object.
function cleanPrevData() {
  [...document.getElementsByTagName("circle")].map(c => c.parentNode.removeChild(c));
}

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

// Could be useful to have the object carry this information inside of it rather than calling it in the case that I need the result.
function correctAnswer(p) {
  return graphType === "x-is-minus-y" ?
    p.x > p.y ? 1 : -1 :
  p.x + p.y > GRAPH_X ? 1 : -1;
}

function getOffset() {
  return graphType === "x-is-minus-y" ? 0 : GRAPH_X;
}

// This is where we need to start using our randomWeights that we defined in the runFunction function. This is essentially the AI's initial bias toward something and it is totally random, but by training it with data and incrementing its bias/weight toward a certain result, it can learn and basically script its own algorithm to identify the correct outcome.
// The first part, takeGuess, will use the given weights (first time is random, after that is is always improving) to determine whether a point ought to be red or blue, which it returns as either 1 or -1. The trainOnce function then compares that to the correct team, and assigns the value of either 0 or -2 to ERROR. When the TRAINED_WEIGHTS object is declared, it adjusts the previous weights accordingly; these will then be passed into the next iteration to be honed further.
function setLearningRate() {
  const REG = /,\s?/g,
        RATES = document.getElementById("lr-new-rates").value.split(REG),
        STEPS = document.getElementById("lr-new-steps").value.split(REG),
        RATE_ARR = STEPS.map((s, i) => [parseFloat(s), parseFloat(RATES[i])]);
  learningRate = RATE_ARR;
}

function countSteps() {
  if (iterationCount >= learningRate[learnRateCount][0] && learnRateCount < learningRate.length -1) {
    learnRateCount++;
  }
  return learningRate[learnRateCount][1];
}

function trainOnce(weights, point, correct) {
  const GUESS = takeGuess(weights, point),
        ERROR = correct - GUESS,
        LEARNING_RATE = countSteps();
  // LEARNING_RATE = learnRateCount < 2 ?
  // 0.01 : learnRateCount < 4 ?
  // 0.001 : learnRateCount < 6 ?
  // 0.0005 : learnRateCount < 8 ?
  // 0.0002 : 0.00005,
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

function trainRange(data, weights, getCorrect) {
  for (let i = 0; i < data.length; i++) {
    trainedWeights = trainOnce(trainedWeights, data[i], getCorrect(data[i]));
    if (shouldRenderAfterPoint === true) {
      renderData([data[i]], trainedWeights);
    }
  }

  if (shouldRenderAfterPoint === false) {
    renderData(data, trainedWeights);
  }
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

// This is very clunky and wasteful. A for loop with a counter that escapes when the accuracy target is not reachable would be faster.
function checkSuccess(batchSize) {
  const TOF = [...document.getElementsByTagName("circle")].map(c => {
    const C = {
      x: parseFloat(c.getAttribute("cx")),
      y: parseFloat(c.getAttribute("cy"))
    };
    const CORR_COL = correctAnswer(C) === 1 ? "red" : "blue";
    return CORR_COL === c.getAttribute("fill");
  });
  FALSIES = TOF.filter(point => point === false).length;
  const PERCENT_SUCCESS = 100 - ((FALSIES/batchSize) * 100);
  return {
    iteration: iterationCount,
    score: PERCENT_SUCCESS,
    fails: FALSIES,
    batchSize: parseInt(batchSize),
    totalPoints: batchSize*iterationCount
  };
}

// This function simply logs the results into the summary array, which I will later use to convey the AI's learning curve through another graph.
function logResults(i) {
  if (i["score"] >= accuracyTarget && i["iteration"] <= maxIterations + 1) {
    summary.push(i);
    resetVars("win");
    renderLastResult(`Success at ${i["iteration"]} with ${i["fails"]}/${i["batchSize"]} mistakes.`);
    return;

  } else if (i["iteration"] <= maxIterations) {
    setTimeout(runFunction, interval);

  } else {
    summary.push[i];
    resetVars("fail");
    renderLastResult(`Failure: only ${i["score"].toFixed(2)}% correct.`);
  }
}

// Using a separate counter for the iteration and the learning rate allow the AI to continue learning after each function execution (if that is desired). If the same count was used, then on every function loop, the learning rate would reset and throw the previous results off a little (LR should go 0.1 > 0.01 > 0.001 etc but if it reset every time the "run function" button was clicked, it would go through the fine-tuning stages before being subject again to the high learning rate).
function resetVars(WL) {
  iterationCount = 0;
  trainedWeights = shouldWeightsReset === true ? randomWeights : trainedWeights;
  if (WL === "fail") {
    learnRateCount = shouldWeightsReset === true ? 0 : learnRateCount;
  }
}

function renderLastResult(result) {
  document.getElementById("result-display").value = result;
}

function toggleSummaryDisplay() {
  isSummaryOpen = !isSummaryOpen;
  document.getElementById("summary-display").style.display = isSummaryOpen === true ? "flex" : "none";
}

function toggleHelpDisplay() {
  isHelpOpen = !isHelpOpen;
  document.getElementById("help-display").style.display = isHelpOpen === true ? "flex" : "none";
}


function initialiseFunction() {
  cleanPrevData();
  const DATA = generateDataRange(batchSize);
  renderData(DATA, randomWeights);
  runFunction();
}

function runFunction() {
  cleanPrevData();
  const DATA = generateDataRange(batchSize);
  trainRange(DATA, trainedWeights, correctAnswer, renderData);
  iterationCount++;

  const ITERATION = checkSuccess(batchSize);
  logResults(ITERATION);
}



// NEXT FEATURE: Design a graph which uses the objects stored in array "summary" and plots them to a graph to visualise the entire process.




[...document.getElementsByClassName("toggle")].map(t => t.addEventListener("click", toggleSwitch));
[...document.getElementsByClassName("graph-button")].map(b => b.addEventListener("click", updateGraphType));
[...document.getElementsByClassName("unfinished")].map(b => b.addEventListener("click", () => alert("Pfft, you know how difficult the other graphs were?!")));
[...document.getElementsByClassName("help-toggle")].map(t => t.addEventListener("click", toggleHelpDisplay));
[...document.getElementsByClassName("summary-toggle")].map(t => t.addEventListener("click", toggleSummaryDisplay));
document.getElementById("batch-size").addEventListener("input", setBatchSize);
document.getElementById("max-iterations").addEventListener("input", setMaxIterations);
document.getElementById("reset-random-weights").addEventListener("click", setRandomWeights);
document.getElementById("set-learning-rate").addEventListener("click", setLearningRate);
document.getElementById("accuracy-rate").addEventListener("input", setAccuracyTarget);
document.getElementById("new-speed").addEventListener("input", setInterval);
document.getElementById("run-function").addEventListener("click", initialiseFunction);

window.addEventListener("keypress", (e) => { if (e.keyCode == 13) { initialiseFunction() }});
window.onresize = () => setGraphSize();
window.onload = () => {
  plotLine(graphType);
  setGraphSize();
  initialiseFunction();
}
