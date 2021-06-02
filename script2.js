$(document).ready(function () {
  // (replace with local storage if exists...)
  // todo - add reset all button??
  let defaultTitle = "Interactive Gantt Chart";
  let defaultSubtitle = "Drag and drop points to edit";
  let defaultRows = ["Planning", "Design", "Development", "Launch"];

  if (localStorage.getItem("title"))
    defaultTitle = localStorage.getItem("title");
  if (localStorage.getItem("subtitle"))
    defaultSubtitle = localStorage.getItem("subtitle");
  if (localStorage.getItem("rows"))
    defaultRows = JSON.parse(localStorage.getItem("rows"));

  $("#reset-chart").click(function () {
    localStorage.clear();
    loadGanttChart(defaultTitle, defaultSubtitle, defaultRows);
  });

  $("#chart-title").attr("placeholder", defaultTitle);
  $("#chart-subtitle").attr("placeholder", defaultSubtitle);

  function loadGanttChart(chartTitle, chartSubtitle, rows) {
    var today = new Date(),
      day = 1000 * 60 * 60 * 24,
      each = Highcharts.each,
      reduce = Highcharts.reduce,
      btnShowDialog = document.getElementById("btnShowDialog"),
      btnRemoveTask = document.getElementById("btnRemoveSelected"),
      btnAddTask = document.getElementById("btnAddTask"),
      btnCancelAddTask = document.getElementById("btnCancelAddTask"),
      addTaskDialog = document.getElementById("addTaskDialog"),
      inputName = document.getElementById("inputName"),
      selectDepartment = document.getElementById("selectDepartment"),
      selectDependency = document.getElementById("selectDependency"),
      chkMilestone = document.getElementById("chkMilestone"),
      isAddingTask = false;

    // Set to 00:00:00:000 today
    today.setUTCHours(0);
    today.setUTCMinutes(0);
    today.setUTCSeconds(0);
    today.setUTCMilliseconds(0);
    today = today.getTime();

    // Update disabled status of the remove button, depending on whether or not we
    // have any selected points.
    function updateRemoveButtonStatus() {
      var chart = this.series.chart;
      // Run in a timeout to allow the select to update
      setTimeout(function () {
        btnRemoveTask.disabled =
          !chart.getSelectedPoints().length || isAddingTask;
      }, 10);
    }

    // Create the chart
    var chart = Highcharts.ganttChart("container", {
      exporting: {
        enabled: true,
      },
      credits: {
        enabled: false,
      },
      chart: {
        styledMode: false,
        spacingLeft: 1,
      },

      title: {
        text: chartTitle,
      },

      subtitle: {
        text: chartSubtitle,
      },

      plotOptions: {
        series: {
          animation: false, // Do not animate dependency connectors
          dragDrop: {
            draggableX: true,
            draggableY: true,
            dragMinY: 0,
            dragMaxY: 4,
            dragPrecisionX: day / 3, // Snap to eight hours
          },
          dataLabels: {
            enabled: true,
            format: "{point.name}",
            // y: 18, // allow user to toggle label position
            style: {
              // color: "black",
              cursor: "default",
              pointerEvents: "none",
            },
          },
          allowPointSelect: true,
          point: {
            events: {
              select: updateRemoveButtonStatus,
              unselect: updateRemoveButtonStatus,
              remove: updateRemoveButtonStatus,
            },
          },
        },
      },

      yAxis: {
        type: "category",
        categories: rows,
        min: 0,
        max: rows.length - 1,
      },

      xAxis: {
        currentDateIndicator: false,
      },

      tooltip: {
        xDateFormat: "%a %b %d, %H:%M",
      },

      series: [
        {
          // name: "Project 1",
          data: [
            {
              start: today + 1,
              end: today + day * 2,
              name: "Gather Requirements",
              id: "prototype",
              y: 0,
            },
            {
              start: today + day * 3,
              name: "Mockup Complete",
              milestone: true,
              dependency: "prototype",
              id: "proto_done",
              y: 1,
            },
            {
              start: today + day * 4,
              end: today + day * 7,
              name: "Design Prototype",
              id: "design",
              dependency: "proto_done",
              y: 1,
            },
            {
              start: today + day * 8,
              end: today + day * 10,
              name: "Testing",
              id: "testing",
              dependency: "design",
              y: 2,
            },
            {
              start: today + day * 10,
              end: today + day * 15,
              name: "Publish App",
              dependency: "testing",
              y: 3,
            },
          ],
        },
      ],
    });

    /* Add button handlers for add/remove tasks */

     btnRemoveTask.onclick = function () {
       var points = chart.getSelectedPoints();
       each(points, function (point) {
         point.remove();
       });
     };

    btnShowDialog.onclick = function () {
      // Update dependency list
      var depInnerHTML = '<option value=""></option>';
      each(chart.series[0].points, function (point) {
        depInnerHTML +=
          '<option value="' + point.id + '">' + point.name + " </option>";
      });
      selectDependency.innerHTML = depInnerHTML;

      // Show dialog by removing "hidden" class
      addTaskDialog.className = "overlay";
      isAddingTask = true;

      // Focus name field
      inputName.value = "";
      inputName.focus();
    };

    btnAddTask.onclick = function () {
      // Get values from dialog
      var series = chart.series[0],
        name = inputName.value,
        undef,
        dependency = chart.get(
          selectDependency.options[selectDependency.selectedIndex].value
        ),
        y = parseInt(
          selectDepartment.options[selectDepartment.selectedIndex].value,
          10
        ),
        maxEnd = reduce(
          series.points,
          function (acc, point) {
            return point.y === y && point.end ? Math.max(acc, point.end) : acc;
          },
          0
        ),
        milestone = chkMilestone.checked || undef;

      // Empty category
      if (maxEnd === 0) {
        maxEnd = today;
      }

      // Add the point
      series.addPoint({
        start: maxEnd + (milestone ? day : 0),
        end: milestone ? undef : maxEnd + day,
        y: y,
        name: name,
        dependency: dependency ? dependency.id : undef,
        milestone: milestone,
      });

      // Hide dialog
      addTaskDialog.className += " hidden";
      isAddingTask = false;
    };

    btnCancelAddTask.onclick = function () {
      // Hide dialog
      addTaskDialog.className += " hidden";
      isAddingTask = false;
    };
  }

  $("#chart-title").val(defaultTitle);
  $("#chart-subtitle").val(defaultSubtitle);

  loadGanttChart(defaultTitle, defaultSubtitle, defaultRows);

  $("#buttonGroup").prepend("<button id='edit-rows'>Edit rows</button>");
  $("#buttonGroup").prepend("<button id='update-title'>Update title</button>");

  $("#update-title").click(function () {
    $("#update-rows-wrapper").hide();
    $("#update-title-wrapper").show();
    $("#chart-title").focus();
    $("#save-title").click(function () {
      localStorage.setItem("title", $("#chart-title").val());
      localStorage.setItem("subtitle", $("#chart-subtitle").val());
      loadGanttChart(
        $("#chart-title").val(),
        $("#chart-subtitle").val(),
        defaultRows
      );
      $("#update-title-wrapper").hide();
    });
  });

  $("#edit-rows").click(function () {
    $("#update-title-wrapper").hide();
    $("#update-rows-wrapper").empty();
    $("#update-rows-wrapper").show();
    for (let i = 0; i < defaultRows.length; i++) {
      let rowHTML =
        "<div class='form-group'>" +
        "<input type='text' class='form-control' id='row-" +
        i +
        "' value='" +
        defaultRows[i] +
        "'/>";
      ("</div>");

      $("#update-rows-wrapper").append(rowHTML);
    }

    $("#row-0").focus();

    $("#update-rows-wrapper").append(
      "<button id='add-row'>Add Row</button><br>"
    );

    $("#update-rows-wrapper").append("<button id='save-rows'>Save</button>");

    $("#update-rows-wrapper").show();

    $("#add-row").click(function () {
      defaultRows.push(" ");
      $("#edit-rows").click();
    });

    $("#save-rows").click(function () {
      let newRows = [];
      $("#update-rows-wrapper input").each(function () {
        newRows.push(this.value);
      });
      localStorage.setItem("rows", JSON.stringify(newRows));
      loadGanttChart(
        $("#chart-title").val(),
        $("#chart-subtitle").val(),
        newRows
      );
      $("#update-rows-wrapper").hide();
    });
  });
});
