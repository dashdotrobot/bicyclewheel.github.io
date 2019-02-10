
var POLAR_LAYOUT = {
  margin: {
    l: 25, r: 25, t: 25, b: 25
  },
  legend: {
    orientation: 'h',
    xanchor: 'center',
    x: 0.5
  },
  polar: {
    angularaxis: {
      rotation: -90,
      showgrid: true,
      showticklabels: false,
      tickmode: 'linear',
      tick0: 0,
      ticks: ''
    },
    radialaxis: {
      angle: -90,
      showgrid: false,
      showticklabels: false
    }
  }
};

var BAR_LAYOUT = {
  margin: {
    l: 25, r: 25, t: 25, b: 25
  },
  legend: {
    orientation: 'h',
    xanchor: 'center',
    x: 0.5
  },
  xaxis: {
    tickmode: 'linear',
    tick0: 0,
    dtick: 1,
    ticks: 'outside',
    showticklabels: false,
  }
}

function array_mult_scalar(x, a) {
  // Multiple each element in an array 'x' a scalar 'a'
  for (var i=0; i < x.length; i++) {
    x[i] *= a;
  }
  return x;
}

function array_add_scalar(x, a) {
  // Add a scalar 'a' to each element in an array 'x'
  for (var i=0; i < x.length; i++) {
    x[i] += a;
  }
  return x;
}

function array_shift(x, n) {
  // Shift the elements in x to the right by n places, with wrapping
  for (var i = 0; i < n; i++) {
    x.unshift(x.pop());
  }
}

function array_range(start, stop, stride) {
  var x = [];
  for (i=start; i < stop; i+=stride) {
    x.push(i);
  }
  return x;
}

function plot_tensions(plot_type) {

  var spk_num = parseInt($('#spkNum').val())

  var theta = array_mult_scalar(calc_result['tension']['spokes'].slice(),
                                360./parseFloat($('#spkNum').val()));
  var tension = array_mult_scalar(calc_result['tension']['tension'].slice(),
                                  1./9.81);
  var tension_0 = array_mult_scalar(calc_result['tension']['tension_initial'].slice(),
                                    1./9.81);
  var tension_d = array_mult_scalar(calc_result['tension']['tension_change'].slice(),
                                    1./9.81);

  array_shift(theta, spk_num/2)
  array_shift(tension, spk_num/2)
  array_shift(tension_0, spk_num/2)
  array_shift(tension_d, spk_num/2)

  // Check if any spoke tensions are negative
  if (tension.some(function(e) {return e < 0})) {
    display_error('Warning', 'At least one spoke has negative tension. Tension and deformation results may not be accurate.');
  }

  // Separate traces for left and right spokes
  nds_ind = (spk_num/2) % 2
  var theta_nds = theta.filter(function(e, i) {return i%2 === nds_ind});
  var T_nds = tension.filter(function(e, i) {return i%2 === nds_ind});
  var T_0_nds = tension_0.filter(function(e, i) {return i%2 === nds_ind});

  ds_ind = (spk_num/2 + 1) % 2
  var theta_ds = theta.filter(function(e, i) {return i%2 === ds_ind});
  var T_ds = tension.filter(function(e, i) {return i%2 === ds_ind});
  var T_0_ds = tension_0.filter(function(e, i) {return i%2 === ds_ind});

  if (plot_type == 'polar') {

    var traces = [
      {
        name: 'Non-drive-side spokes',
        r: T_nds.concat(T_nds[0]),
        theta: theta_nds.concat(theta_nds[0]),
        type: 'scatterpolar',
        mode: 'lines+markers',
        line: {color: '#1f77b4'}
      },
      {
        r: T_0_nds.concat(T_0_nds[0]),
        theta: theta_nds.concat(theta_nds[0]),
        type: 'scatterpolar',
        mode: 'lines',
        showlegend: false,
        line: {color: '#1f77b4', shape: 'spline'},
        opacity: 0.5
      },
      {
        name: 'Drive-side spokes',
        r: T_ds.concat(T_ds[0]),
        theta: theta_ds.concat(theta_ds[0]),
        type: 'scatterpolar',
        mode: 'lines+markers',
        line: {color: '#ff7f0e'}
      },
      {
        r: T_0_ds.concat(T_0_ds[0]),
        theta: theta_ds.concat(theta_ds[0]),
        type: 'scatterpolar',
        mode: 'lines',
        showlegend: false,
        line: {color: '#ff7f0e', shape: 'spline'},
        opacity: 0.5
      }
    ]

    var layout = $.extend({}, POLAR_LAYOUT);
    layout['polar']['angularaxis']['dtick'] = 360. / spk_num;

  } else if (plot_type == 'column') {

    var traces = [
      {
        name: 'Non-drive-side spokes',
        x: array_range(nds_ind, spk_num, 2),
        y: T_nds,
        type: 'bar',
        marker: {'color': '#1f77b4'}
      },
      {
        name: 'Drive-side spoke',
        x: array_range(ds_ind, spk_num, 2),
        y: T_ds,
        type: 'bar',
        marker: {'color': '#ff7f0e'}
      }
    ]

    var layout = $.extend({}, BAR_LAYOUT);
  }

  var plot_canvas = document.getElementById('tension-plot');

  Plotly.newPlot(plot_canvas, traces, layout, {
    responsive: true,
    modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
    displaylogo: false
  });
}

function plot_deformation_polar() {

  var rim_radius = calc_result['wheel']['rim']['radius'];

  var theta = array_mult_scalar(calc_result['deformation']['theta'].slice(), 180./Math.PI);
  var ones = array_add_scalar(array_mult_scalar(theta.slice(), 0.), 1);  // THIS IS PROBABLY NOT EFFICIENT
  var def_rad = array_mult_scalar(calc_result['deformation']['def_rad'].slice(), -1);
  var def_lat = calc_result['deformation']['def_lat'].slice();
  var def_tor = array_mult_scalar(calc_result['deformation']['def_tor'].slice(), rim_radius);

  var traces_deform = {
    'Radial': {
      name: 'Radial',
      def: def_rad,
      def_max: Math.max.apply(null, def_rad.map(Math.abs)),
      line: {color: '#1f77b4', shape: 'spline'},
    },
    'Lateral': {
      name: 'Lateral',
      def: def_lat,
      def_max: Math.max.apply(null, def_lat.map(Math.abs)),
      line: {color: '#ff7f0e', shape: 'spline'},
    },
    'Twist': {
      name: 'Twist (R*phi)',
      def: def_tor,
      def_max: Math.max.apply(null, def_tor.map(Math.abs)),
      line: {color: '#2ca02c', shape: 'spline'},
    }
  };

  // Add selected traces to a new list
  var trace_select = [];
  var def_max = [];
  $('.deform-button').each(function() {
    if ($(this).hasClass('active')) {
      trace_select.push(traces_deform[$(this).text().trim()]);
      def_max.push(traces_deform[$(this).text().trim()]['def_max']);
    }
  });

  // Calculate scaling factor
  var scale_factor = parseFloat($('#scaleFactor').val()) / 100. / Math.max.apply(null, def_max);

  // Apply scaling factor to each trace
  for (var t=0; t < trace_select.length; t++) {
    var tr = trace_select[t];
    tr['r'] = array_add_scalar(array_mult_scalar(tr['def'], scale_factor), 1.);
    tr['theta'] = theta.slice();

    // Connect trace to its endpoint
    tr['theta'].push(tr['theta'][0]);
    tr['r'].push(tr['r'][0]);

    // Line options
    tr['type'] = 'scatterpolar';
    tr['mode'] = 'lines';
    tr['showlegend'] = true;
  }

  // Add a gray reference circle
  var trace_unitcircle = [
    {
      r: ones.concat(ones[0]),
      theta: theta.concat(theta[0]),
      type: 'scatterpolar',
      mode: 'lines',
      showlegend: false,
      line: {color: '#333333', shape: 'spline'},
    }
  ];

  var layout = $.extend({}, POLAR_LAYOUT);
  layout['polar']['angularaxis']['dtick'] = 360. / parseInt($('#spkNum').val());

  var plot_canvas = document.getElementById('deform-plot');
  Plotly.newPlot(plot_canvas, trace_unitcircle.concat(trace_select), layout, {
    responsive: true,
    modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
    displaylogo: false
  });
}
