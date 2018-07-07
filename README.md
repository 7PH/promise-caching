# Promise-Caching

Let's suppose you have a high cost function that returns a promise. This library allows you to:

- cache its result for a specified amount of time
- decide whether you want to return the expired cache or force regeneration when it expires

## Time chart

Here is a chart of what's happening when you set 'returnExpired' to false

![Time chart](/doc/time-chart.png?raw=true "Time chart")

When you set 'returnExpired' to true, retrieving an expired promise won't hang. Instead, it will return the expired promise and regenerate a new result in background.
