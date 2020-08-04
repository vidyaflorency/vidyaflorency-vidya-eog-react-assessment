import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import { Measurement } from './../interface';

const useStyles = makeStyles({
  chip: {
    minWidth: 250,
    minHeight: 50,
    margin: 3,
    fontSize: 25,
    fontWeight: 600,
    backgroundColor: 'white',
    borderRadius: 6,
  },
});

export function DataChips(props: { measurement: Measurement }) {
  const classes = useStyles();
  const { measurement } = props;

  return <Chip className={classes.chip} label={`${measurement.metric}: ${measurement.value}${measurement.unit}`} />;
}
