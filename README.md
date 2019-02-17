# Machine-Learning-Chart
Here you'll find a chart plotted by a simple AI. The goal is to have the AI plot above the x = y*-1 bisector with red points and below with blue. Each batch of data builds upon all previous data.

-----

Recently I watched a video about neural networks and I realised that something simple could be done with JavaScript.
I watched a tutorial in preparation and read even more about how neural networks work and I began to try to figure it out on my own (although I admit, I had to check back a couple of times along the way).

What you'll see here is a chart which generates n number of co-ordinates and tries to plot them on the graph above the x = y*-1 bisector. Each batch of data, the size of which is defined by the user, generates random co-ordinates and plots them on the chart. When the point is shown to be incorrect by the object carrying the co-ordinates, the AI corrects its weights slightly, depending on how many batches it has done (a very basic, double-ternary defines the three learning rates). Unless the page is refreshed, data is collected and stored so that subsequent batches only yield better and better results.
