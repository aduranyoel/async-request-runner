const
    express = require('express'),
    path = require('path'),
    async = require('async'),
    newman = require('newman'),
    router = express.Router();

router.post('/', (req, res) => {

    const times = Number(req.body.times) || 1;
    let options;
    try {
        options = {collection: JSON.parse(req.files.collection.data.toString())};
    } catch (e) {
        options = {};
    }

    const parallelCollectionRun = function (done) {
        newman.run(options, done);
    };

    function duplicateTask(number, task) {
        const result = [];
        for (let index = 0; index < number; index++) {
            result.push(task);
        }
        return result;
    }

    async.parallel(duplicateTask(times, parallelCollectionRun),
        function (err, response) {
            if (err) return res.json({
                error: err,
                response
            });

            res.json({
                error: null,
                response
            });
        });
});

module.exports = router;
