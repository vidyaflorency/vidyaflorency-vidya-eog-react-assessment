import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent } from '@material-ui/core';
import DashboardHeader from './DashboardHeader';
import Chart from './Chart';
import { useSubscription } from '@apollo/react-hooks';
import {newMeasurementSubscription, fetchMetrics, fetchData, dataFilter, dataTransformer} from './../api';
import { Measurement, MeasurementSub } from './../interface';


const useStyles = makeStyles({
  card: {
    margin: '5% 10%',
  },
  taskBar: {
    backgroundColor: '#c0c0c036',
  },
});

export default () => {

  const classes = useStyles();
  const [metricStrings, setMetricStrings] = React.useState<string[]>([]);
  const [selection, setSelection] = React.useState<(string | undefined)[]>([]);
  const [initialData, setInitialData] = React.useState<Plotly.Data[]>([]);
  const [filteredData, setFilteredData] = React.useState<Plotly.Data[]>([]);
  const { loading, data } = useSubscription<MeasurementSub>(newMeasurementSubscription);
  const [prevSubData, setPrevSubData] = React.useState<Measurement>({ metric: "", at: 0, value: 0, unit: "" });
  const [latestData, setLatestData] = React.useState<Measurement[]>([])

  React.useEffect(() => {
    const initialFetch = async () => {

      const metricsRes = await fetchMetrics();
      const dataRes = await fetchData(metricsRes);
      const transformedData = dataTransformer(dataRes);

      setMetricStrings(metricsRes);

      let initialLatestData: Measurement[] = []
      metricsRes.forEach((metric: string) => {
        initialLatestData.push({ metric: metric, at: 0, value: 0, unit: "" })
      })
      setLatestData(initialLatestData);
      setInitialData(transformedData);
    };

    initialFetch();
  }, []);

  React.useEffect(() => {
    const filteredDataValue = dataFilter(initialData, selection);
    setFilteredData(filteredDataValue);
  }, [initialData, selection]);

  React.useEffect(() => {
    if (!loading && (data?.newMeasurement.at !== prevSubData.at || data.newMeasurement.value !== prevSubData.value || data.newMeasurement.metric !== prevSubData.metric)) {
      let measurementNode = data?.newMeasurement
      let matchingSet = initialData.find((metricNode) => metricNode.name === measurementNode?.metric);
      if (matchingSet && measurementNode) {
        (matchingSet.x as Plotly.Datum[]).push(new Date(measurementNode.at));
        (matchingSet.y as Plotly.Datum[]).push(measurementNode.value);
        const updatedData = initialData.map((metricNode) => {
          if (metricNode.name === measurementNode?.metric) {
            return matchingSet
          } else {
            return metricNode
          }
        });
        setInitialData(updatedData as Plotly.Data[]);
        if (data) {
          let latestDataTemplate = latestData.map((measurement) => {
            return measurement.metric === data.newMeasurement.metric ? data.newMeasurement : measurement
          })
          setLatestData(latestDataTemplate)
          setPrevSubData(data.newMeasurement)
        }
      }
    }
  }, [initialData, loading, data, prevSubData, latestData])

  return (
    <Card className={classes.card}>
      <DashboardHeader metrics={metricStrings} selection={selection} setSelection={setSelection} latestData={latestData} />
      <CardContent style={{ padding: 0 }}>
        <Chart data={filteredData} />
      </CardContent>
    </Card>
  );
};
