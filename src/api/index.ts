import { gql } from '@apollo/client';
import { client } from '../App';
import { MetricNode } from './../interface';

export const thirtyMinAgo = new Date(Date.now() - 30 * 60000).getTime();

export const getMetricsQuery = `
  query{
    getMetrics
  }
`;

export const getInput = (metrics: string[]) => {
  return metrics.map(metric => {
    return `{ metricName: "${metric}", after: ${thirtyMinAgo} }`;
  });
};

export const getData = (inputQuery: string[]) => {
  return `
 query {
   getMultipleMeasurements(input: [${inputQuery}]){
     metric,
     measurements {
       metric,
       at,
       value,
       unit
     }
   }
 }
`;
};

export const newMeasurementSubscription = gql`
  subscription {
    newMeasurement {
      metric
      at
      value
      unit
    }
  }
`;

export const fetchMetrics = async () => {
  const res = await client.query({
    query: gql`
      ${getMetricsQuery}
    `,
  });
  return res.data.getMetrics;
};

export const fetchData = async (metrics: string[]) => {
  const res = await client.query({
    query: gql`
      ${getData(getInput(metrics))}
    `,
  });
  return res.data.getMultipleMeasurements;
};

export const dataFilter = (data: Plotly.Data[], selection: (string | undefined)[]) => {
  let returnObj = data.filter(metricObj => {
    return selection.includes(metricObj.name);
  });

  const dummyData: Plotly.Data = {
    x: [],
    y: [],
    name: '',
    yaxis: 'y',
    type: 'scatter',
    line: { color: '#444' },
  };

  returnObj.push(dummyData);

  return returnObj;
};

export const dataTransformer = (data: MetricNode[]) => {
  const returnObj: Plotly.Data[] = [];
  const colorArray: string[] = ['#8f0505', 'red', 'Orange', '#e9da27', '#7ae742', '#1e2a7e'];
  data.forEach(metricNode => {
    let metricObj: Plotly.Data = {
      x: [],
      y: [],
      name: '',
      yaxis: '',
      type: 'scatter',
      line: { color: colorArray[data.indexOf(metricNode)] },
    };
    metricNode.measurements.forEach(measurement => {
      (metricObj.x as Plotly.Datum[]).push(new Date(measurement.at));
      (metricObj.y as Plotly.Datum[]).push(measurement.value);
    });
    metricObj.name = metricNode.metric;
    switch (metricNode.measurements[0].unit) {
      case 'F':
        metricObj.yaxis = 'y';
        break;
      case 'PSI':
        metricObj.yaxis = 'y2';
        break;
      case '%':
        metricObj.yaxis = 'y3';
    }
    returnObj.push(metricObj);
  });
  return returnObj;
};