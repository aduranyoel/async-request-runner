module.exports = function (result) {
    const
        failures = result.run.failures,
        ok = !failures.length;
    this.collection = result.collection.name;
    this.request = Array.isArray(result.run.executions) && result.run.executions.length ? result.run.executions[0].request : null;
    this.error = !ok ? JSON.stringify(failures) : null;
    this.success = ok;
    this.time = {
        timings: result.run.timings,
        lapse: (new Date(result.run.timings.completed).getTime() - new Date(result.run.timings.started).getTime()) / 1000
    };

};
