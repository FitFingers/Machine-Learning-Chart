const GRAPH = document.getElementById("graph"),
      GRAPH_X = GRAPH.getAttribute("width")/2,
      GRAPH_Y = GRAPH.getAttribute("height")/2,
      RANDOM_WEIGHTS = {
        x: randomNumber(-1, 1),
        y: randomNumber(-1, 1)
      };

// If this was live, I would store the trainedWeights variable on the server-side so that it would always improve through user input and not restart every time the page refreshes. I don't know yet how I would deal with converging multiple user's data.
let trainedWeights = RANDOM_WEIGHTS,
    batchSize = 200,
    count = 0;


// First, we have to generate an array of any length. This will be our data set, so the more data, the more accurate our AI will be. We need to set the elements in this array to equal random co-ordinates, so we can use the function randomNumber to generate these (as well as converting them to fit correctly into the graph) and return to each element an object.
function randomNumber(low, high) {
  return Math.random() * (high - low) + low;
}

function generateDataRange(high) {
  // high = parseInt(high);
  const RANGE = [...Array(parseInt(high)).keys()].map(p =>{
    return {
      x: randomNumber(-1, 1) * GRAPH_X + GRAPH_X,
      y: randomNumber(-1, 1) * GRAPH_Y + GRAPH_Y
    }});
  return RANGE;
}

function getTeam(p) {
  return p.x > p.y ? 1 : -1;
}

// This is where we need to start using our RANDOM_WEIGHTS that we defined in the runFunction function. This is essentially the AI's initial bias toward something and it is totally random, but by training it with data and incrementing its bias/weight toward a certain result, it can learn and basically script its own algorithm to identify the correct outcome.
// The first part, takeGuess, will use the given weights (first time is random, after that is is always improving) to determine whether a point ought to be red or blue, which it returns as either 1 or -1. The trainOnce function then compares that to the correct team, and assigns the value of either 0 or -2 to ERROR. When the TRAINED_WEIGHTS object is declared, it 
function trainOnce(weights, point, team) {
  const RESULT = takeGuess(weights, point),
        ERROR = team - RESULT,
        LEARNING_RATE = count < batchSize*10 ? 0.1 : count < batchSize*2.5 ? 0.03 : 0.005,
        TRAINED_WEIGHTS = {
          x: weights.x + (point.x * ERROR * LEARNING_RATE),
          y: weights.y + (point.y * ERROR * LEARNING_RATE)
        };
  return TRAINED_WEIGHTS;
}

function takeGuess(weights, point) {
  const SUM =
        weights.x * point.x +
        weights.y * point.y;
  const TEAM = SUM > 0 ? 1 : -1;
  return TEAM;
}

function trainRange(data, weights, getCorrect, render) {
  for (let i = 0; i < data.length; i++) {
    trainedWeights = trainOnce(trainedWeights, data[i], getCorrect(data[i]));
    // render([data[i]], trainedWeights);      // << HERE HAS A FEW STRAYS BUT IS *ALWAYS* ON THE CORRECT LINE
  }
  render(data, trainedWeights);       // << HERE WE HAVE NO STRAYS BUT SOMETIMES DEVIATE SUBSTANTIALLY FROM THE LINE. render IS A CALLBACK SO I CAN REUSE THIS FUNCTION ELSEWHERE.
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

// Using a count and batchSize variable, we can filter down the learning rate as the results get more reliable so as to fine-tune the AI.
function runFunction() {
  batchSize = document.getElementById("batch-size").value || 200;
  [...document.getElementsByTagName("circle")].map(c => c.parentNode.removeChild(c));
  const DATA = generateDataRange(batchSize);
  trainRange(DATA, trainedWeights, getTeam, renderData);
  count += batchSize;
}






document.getElementById("run-function").addEventListener("click", runFunction);
window.addEventListener("keypress", (e) => { if (e.keyCode == 13) { runFunction() }});



window.onload = () => {
  runFunction();
}

