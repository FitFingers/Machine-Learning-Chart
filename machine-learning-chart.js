const GRAPH = document.getElementById("main-graph"),
      GRAPH_X = 600,
      GRAPH_Y = 600,
      COLOURS = {
        maincol: "#5D737E",
        buttcol: "#3F4045",
        ctacol: "#008000",
        errorcol: "#C96969",
      }

let randomWeights = generateRandomWeights(),
    trainedWeights = randomWeights,
    iterationCount = 0,
    batchSize = 50,
    maxIterations = 100,
    learningRate = [[2, 0.01], [4, 0.001], [6, 0.0005], [8, 0.0002]],
    learnRateCount = 0,
    accuracyTarget = 99,
    shouldWeightsReset = true,
    interval = 0,
    shouldRenderAfterPoint = false,
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
    "batch-iteration-toggle": {
      true: "Batch",
      false: "Point",
    }
  }
  document.getElementById(e).innerHTML = TEXT_VALUES[e][isToggleOn];

  e === "weight-reset-toggle" ?
    shouldWeightsReset = !shouldWeightsReset :
  shouldRenderAfterPoint = !shouldRenderAfterPoint;
}

function toggleHelpDisplay() {
  isHelpOpen = !isHelpOpen;
  document.getElementById("help-display").style.display = isHelpOpen === true ? "flex" : "none";
}

function toggleSummaryDisplay() {
  isSummaryOpen = !isSummaryOpen;
  document.getElementById("summary-display").style.display = isSummaryOpen === true ? "flex" : "none";
  isSummaryOpen === true ? plotSummaryGraph() : cleanSummaryGraph();
}



function plotSummaryGraph() {
  const SUM_GRAPH = document.getElementById("summary-graph"),
        SIZE = summary.length < 20 ? summary.length : 20,
        DATA = summary.slice(0, SIZE),
        LIMITS = { // LIMITS belongs here to use the prop.[min|max] below!
          batchSize: [DATA[0].score, null],
          score: [DATA[0].score, null],
          iteration: [DATA[0].iteration, null],
          totalPoints: [DATA[0].totalPoints, null]
        },
        RANGE = getSummaryRange(DATA, LIMITS),
        WIDTH = parseInt(SUM_GRAPH.getAttribute("viewBox").split(" ")[2]),
        X_STEP = WIDTH/SIZE,
        HEIGHT = parseInt(SUM_GRAPH.getAttribute("viewBox").split(" ")[3]),
        Y_STEP = HEIGHT/(RANGE.iteration);

  DATA.map((d, i) => {
    const NEW_POINT = document.createElementNS("http://www.w3.org/2000/svg", "circle"),
          F_OBJECT = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject"),
          POINT_TEXT = document.createElement("pre"),
          TEXT_CONTENT = document.createTextNode(
            `Success Rate: ${JSON.stringify(d.score)}
Batch Size: ${JSON.stringify(d.batchSize)}
Total Iterations: ${JSON.stringify(d.iteration)}`
          ),
          C_X = (WIDTH - (X_STEP * i)) - X_STEP/2,
          C_Y = (0.9 * (Y_STEP * (d.iteration - LIMITS.iteration[0])) + (HEIGHT * 0.05)),
          L_X = WIDTH - (C_X + 10) >= 200 ? C_X + 10 : C_X - 200,
          L_Y = HEIGHT - (C_Y - 5) >= 120 ? C_Y - 5 : C_Y - 85,
          COLOUR = d.iteration >= maxIterations ? COLOURS.errorcol : d.iteration <= 1 ? COLOURS.ctacol : COLOURS.maincol;

    NEW_POINT.setAttribute("id", `sg-circle${i}`);
    NEW_POINT.setAttribute("cx", C_X);
    NEW_POINT.setAttribute("cy", C_Y);
    NEW_POINT.setAttribute("r", 6);
    NEW_POINT.setAttribute("fill", COLOUR);
    F_OBJECT.setAttribute("x", L_X);
    F_OBJECT.setAttribute("y", L_Y);
    F_OBJECT.appendChild(POINT_TEXT);
    POINT_TEXT.setAttribute("id", `sg-label${i}`);
    POINT_TEXT.appendChild(TEXT_CONTENT);
    NEW_POINT.addEventListener("mouseover", () => togglePointContent(i));
    NEW_POINT.addEventListener("mouseout", () => togglePointContent(i));
    SUM_GRAPH.append(NEW_POINT);
    SUM_GRAPH.append(F_OBJECT);
  });
}

function togglePointContent(i) {
  document.getElementById(`sg-label${i}`).style.display = event.type === "mouseover" ?
    "block" : "none";
}

function getSummaryRange(data, limits) {
  data.map(d => {
    checkBoundary(d.batchSize, "batchSize", limits);
    checkBoundary(d.score, "score", limits);
    checkBoundary(d.iteration, "iteration", limits);
    checkBoundary(d.totalPoints, "totalPoints", limits);
  });
  return {
    batchSize: limits.batchSize[1] - limits.batchSize[0] < 0 ? 0 : limits.batchSize[1] - limits.batchSize[0],
    score: limits.score[1] - limits.score[0] < 0 ? 0 : limits.score[1] - limits.score[0],
    iteration: limits.iteration[1] - limits.iteration[0] < 0 ? 0 : limits.iteration[1] - limits.iteration[0],
    totalPoints: limits.totalPoints[1] - limits.totalPoints[0] < 0 ? 0 : limits.totalPoints[1] - limits.totalPoints[0]
  };
}

function checkBoundary(prop, name, limit) {
  prop < limit[name][0] ? limit[name][0] = prop :
  prop > limit[name][1] ? limit[name][1] = prop :
  "No limit breached.";
}

function cleanSummaryGraph() {
  [...document.getElementById("summary-graph").getElementsByTagName("circle")].map(c => c.parentNode.removeChild(c));
  [...document.getElementsByTagName("foreignObject")].map(o => o.parentNode.removeChild(o));
}



function setVariable(...args) {
  const NEW_VALUE = parseInt(event.target.value);
  args.includes("batch") ? batchSize = NEW_VALUE :
  args.includes("iterations") ? maxIterations = NEW_VALUE :
  args.includes("accuracy") ? accuracyTarget = NEW_VALUE :
  args.includes("interval") ? interval = NEW_VALUE :
  "No variable supplied";
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
  LINE.setAttribute("stroke", COLOURS.ctacol);
  LINE.classList.add("bisector");
  GRAPH.appendChild(LINE);
}

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

function correctAnswer(p) {
  return graphType === "x-is-minus-y" ?
    p.x > p.y ? 1 : -1 :
  p.x + p.y > GRAPH_X ? 1 : -1;
}

function getOffset() {
  return graphType === "x-is-minus-y" ? 0 : GRAPH_X;
}

function setLearningRate() {
  const REG = /,\s?/g,
        RATES = document.getElementById("lr-new-rates").value.split(REG),
        STEPS = document.getElementById("lr-new-steps").value.split(REG),
        RATE_ARR = STEPS.map((s, i) => [parseFloat(s), parseFloat(RATES[i])]);
  RATES.length !== STEPS.length ?
    alert("Learning rate and steps are not of the same length") :
  RATES.length < 2 ? alert("Learning rate must have more than one entry") :
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
    const NEW_POINT = document.createElementNS("http://www.w3.org/2000/svg", "circle"),
          COLOUR = takeGuess(weights, p) === 1 ? COLOURS.errorcol : COLOURS.maincol;
    NEW_POINT.setAttribute("cx", p.x);
    NEW_POINT.setAttribute("cy", p.y);
    NEW_POINT.setAttribute("r", 4);
    NEW_POINT.setAttribute("fill", COLOUR);
    GRAPH.appendChild(NEW_POINT);
  });
}

// This is very clunky and wasteful. A for loop with a counter that escapes when the accuracy target is not reachable would be faster.
function checkSuccess(batchSize) {
  const TOF = [...document.getElementsByTagName("circle")].map(c => {
    const C = {
      x: parseFloat(c.getAttribute("cx")),
      y: parseFloat(c.getAttribute("cy"))
    };
    const CORR_COL = correctAnswer(C) === 1 ? COLOURS.errorcol : COLOURS.maincol;
    return CORR_COL === c.getAttribute("fill");
  });
  const FALSIES = TOF.filter(point => point === false).length,
        PERCENT_SUCCESS = 100 - ((FALSIES/batchSize) * 100);
  return {
    iteration: iterationCount,
    score: PERCENT_SUCCESS,
    fails: FALSIES,
    batchSize: parseInt(batchSize),
    totalPoints: batchSize*iterationCount
  };
}

function logResults(result) {
  if (result["score"] >= accuracyTarget && result["iteration"] <= maxIterations + 1) {
    summary.unshift(result);
    resetVars("win");
    renderLastResult(`Success at ${result["iteration"]} with ${result["fails"]}/${result["batchSize"]} mistakes.`);
    return;

  } else if (result["iteration"] < maxIterations) {
    setTimeout(runFunction, interval);

  } else {
    summary.unshift(result);
    resetVars("fail");
    renderLastResult(`Failure: only ${result["score"].toFixed(2)}% correct.`);
  }
}

// Using a separate counter for the iteration and the learning rate allows the AI to continue learning after each function execution (if that is desired). If the same count was used, then on every function loop, the learning rate would reset and throw the previous results off a little (LR should go 0.1 > 0.01 > 0.001 and stay low after that but if it reset every time the "run function" button was clicked, it would go through the fine-tuning stages before being subject again to the high learning rate). This way, we can see how the AI behaves after it has a winning solution (sometimes it will guess wildly again but mostly it is pretty accurate after a successful render).
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





[...document.getElementsByClassName("toggle")].map(t => t.addEventListener("click", toggleSwitch));
[...document.getElementsByClassName("graph-button")].map(b => b.addEventListener("click", updateGraphType));
[...document.getElementsByClassName("unfinished")].map(b => b.addEventListener("click", () => alert("Pfft, you know how difficult the other graphs were?!")));
[...document.getElementsByClassName("help-toggle")].map(t => t.addEventListener("click", toggleHelpDisplay));
[...document.getElementsByClassName("summary-toggle")].map(t => t.addEventListener("click", toggleSummaryDisplay));
document.getElementById("batch-size").addEventListener("input", () => setVariable("batch"));
document.getElementById("max-iterations").addEventListener("input", () => setVariable("iterations"));
document.getElementById("reset-random-weights").addEventListener("click", setRandomWeights);
document.getElementById("set-learning-rate").addEventListener("click", setLearningRate);
document.getElementById("accuracy-rate").addEventListener("input", () => setVariable("accuracy"));
document.getElementById("new-speed").addEventListener("input", () => setVariable("interval"));
document.getElementById("run-function").addEventListener("click", initialiseFunction);

window.addEventListener("keypress", (e) => { if (e.keyCode == 13) { initialiseFunction() }});
window.onresize = () => setGraphSize();
window.onload = () => {
  plotLine(graphType);
  setGraphSize();
  initialiseFunction();
}
