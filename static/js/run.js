let average = [];

$(document).ready(function () {

    $('.custom-file-input').on('change', function () {
        let fileName = $(this).val().split('\\').pop();
        $('#labelFile').addClass("selected").html(fileName);
        $('#submit').prop('disabled', !this.files.length);
        $('#submit').html('Send');

        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = onReaderLoad;
            reader.readAsText(file);

            function onReaderLoad(event) {
                const collection = JSON.parse(event.target.result);
                $('#collectionName').html(collection.info.name);
                let items = '';
                collection.item.forEach(i => items +=
                    `<tr>
                        <td>
                            <strong>Name</strong> ${i.name}
                        </td>
                    </tr>`);
                $('#collectionInfo tbody').html(items);
            }
        } else {
            resetInfo();
        }
    });

    $('#times').on('keypress', function (e) {
        return /[0-9]/.test(String.fromCharCode(e.keyCode));
    });

    $('#plus').on('click', function () {
        $('#times').val(Number($('#times').val()) + 1);
    });

    $('#less').on('click', function () {
        if (Number($('#times').val()) > 1) $('#times').val(Number($('#times').val()) - 1);
    });

    $('#submit').on('click', function () {
        var fd = new FormData();
        fd.append('collection', $('.custom-file-input')[0].files[0]);
        fd.append('times', $('#times').val());
        submitSwitch(true);
        $.ajax({
            url: "/run",
            data: fd,
            cache: false,
            processData: false,
            contentType: false,
            type: 'POST',
            success: processResponse,
            error: function () {
                submitSwitch(false);
                $('#submit').html('Has error');
                resetData();
                swal({
                    title: "Unexpected error",
                    text: "An error occurred while trying send the request",
                    type: "error"
                });
            }
        });
    });

    let sparkResize;

    $(window).resize(function (e) {
        clearTimeout(sparkResize);
        sparkResize = setTimeout(() => {
            chartTime(average)
            $.fn.dataTable.tables({visible: true, api: true}).columns.adjust();
        }, 500);
    });

    resetData();
    resetInfo();
});

function processResponse(data) {
    submitSwitch(false);
    if (data && data.response && data.response.length) {
        let sumAverage = 0,
            min = 0,
            max = 0,
            success = 0,
            errors = 0;

        average = data.response.map(r => {
            sumAverage += r.run.timings.responseAverage;
            if (!min || min > r.run.timings.started) min = r.run.timings.started;
            if (max < r.run.timings.completed) max = r.run.timings.completed;

            success += r.run.executions.length;
            if (r.run.failures.length) {
                success -= r.run.failures.length;
                errors += r.run.failures.length;
            }
            return r.run.timings.responseAverage;
        });
        chartTime(average);
        $('#responseAverage').html((sumAverage / average.length).toFixed(2));
        $('#started').html(new Date(min).toLocaleString());
        $('#completed').html(new Date(max).toLocaleString());
        $('#timeLapsed').html(((new Date(max).getTime() - new Date(min).getTime()) / 1000).toFixed(2) + ' seconds');
        chartPie([success, errors]);
        fillDatatables(data.response);

    } else {
        resetData();
    }
}

function submitSwitch(active) {
    active ? $('#submit').addClass('lds-dual-ring') : $('#submit').removeClass('lds-dual-ring');
    $('#submit').html(active ? '' : 'Send');
    $('#submit').prop('disabled', active);
}

function chartTime(data) {
    $("#sparkline1").sparkline(data, {
        type: 'line',
        width: '100%',
        height: '50',
        lineColor: '#1ab394',
        fillColor: "transparent"
    });
}

function resetData() {
    chartTime([]);
    chartPie([0, 0]);
    fillDatatables();
    $('#responseAverage').html('0');
    $('#started').html('0');
    $('#completed').html('0');
    $('#timeLapsed').html('0 seconds');
}

function chartPie(data) {
    let doughnutData = {
        labels: ["Success", "Error"],
        datasets: [{
            data,
            backgroundColor: ["#a3e1d4", "#ed5565"]
        }]
    };

    let doughnutOptions = {
        responsive: true
    };

    let ctx4 = document.getElementById("doughnutChart").getContext("2d");
    new Chart(ctx4, {type: 'doughnut', data: doughnutData, options: doughnutOptions});
}

function resetInfo() {
    $('#collectionName').html('...');
    $('#collectionInfo tbody').html(`<tr>
                        <td>
                            <strong>Name</strong> 
                        </td>
                    </tr>`);
}

function fillDatatables(response = []) {
    let counter = 0;
    const dataParsed = response.reduce((acc, d) => {
        acc.push(...d.run.executions.map(e => {
            let error = !e.response && d.run.failures && d.run.failures.find(f => f.source.id === e.id) ? d.run.failures.find(f => f.source.id === e.id).error.message : '';
            return {
                id: ++counter,
                method: e.request.method,
                name: e.item.name,
                status: e.response ? `${e.response.code} ${e.response.status}` : '',
                url: `${e.request.url.protocol}://${e.request.url.host.join('.')}/${e.request.url.path.join('/')}`,
                header: e.request.header.map(h => `${h.key}: ${h.value}`).join('</br>'),
                error,
                result: error ? '<i class="fa fa-times"></i>' : '<i class="fa fa-check"></i>',
                detail: '<button type="button" class="btn btn-default btn-xs btn-detail">Detail</button>'
            }
        }));
        return acc;
    }, []);
    $('.dataTables-example').DataTable({
        columns: [
            {title: 'Id', data: 'id', width: '20px'},
            {title: 'Method', data: 'method', width: '100px'},
            {title: 'Name', data: 'name'},
            {title: 'Status', data: 'status', width: '150px'},
            {title: 'Result', data: 'result', width: '50px'},
            {title: 'Detail', data: 'detail', width: '50px'}
        ],
        rowCallback: function (row, data) {
            $(row).off();
            $(row).on('click', () => detail(data));
        },
        data: dataParsed,
        pageLength: 10,
        responsive: true,
        dom: '<"html5buttons"B>lTfgitp',
        destroy: true,
        buttons: [
            {extend: 'copy'},
            {extend: 'csv'},
            {extend: 'excel', title: 'ExampleFile'},
            {extend: 'pdf', title: 'ExampleFile'},

            {
                extend: 'print',
                customize: function (win) {
                    $(win.document.body).addClass('white-bg');
                    $(win.document.body).css('font-size', '10px');

                    $(win.document.body).find('table')
                        .addClass('compact')
                        .css('font-size', 'inherit');
                }
            }
        ]
    });
}

function detail(data = {}) {
    const {url = '', header = '', error = ''} = data;
    $('#modalUrl').html(url);
    $('#modalHeader').html(header);
    $('#modalError').html(error);
    $('#myModal').modal('show');
}
