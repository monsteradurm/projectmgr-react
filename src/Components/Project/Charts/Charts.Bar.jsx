import { SUSPENSE } from '@react-rxjs/core';
import { Chart } from 'primereact/chart';
import { Dropdown } from 'primereact/dropdown';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChartOptions, useChartData, ChartTypes, useChartType, SetChartType, ChartClickEvent$ } from './Charts.context';
import { useBusyMessage, AddQueueMessage, RemoveQueueMessage } from '../../../App.MessageQueue.context';
import { Stack } from "react-bootstrap";
import { BreedingRhombusSpinner } from "react-epic-spinners";
import { useRef } from 'react';
import { Bar, getDatasetAtEvent, getElementAtEvent } from 'react-chartjs-2';
import { toggleArrFilter, toggleStatusFilter } from '../Overview.filters'
import "./Charts.scss";

const CHART_ID = '/Charts';

const SetChartSearchParams = (type, searchParams, setSearchParams) => {
    searchParams.set('ChartType', type);
    setSearchParams(searchParams);
}
const SetFilters = (filterType, filterValue, searchParams, setSearchParams) => {
    console.log(filterType);
    let key;
    if (['Artist', 'Status', 'Tags'].indexOf(filterType) >= 0)
        key = 'Board' + filterType + 'Filter'
    key = key ? key.replace('BoardTagsFilter', 'BoardTagFilter') : null;
    if (key && filterType === 'Status') {
        toggleStatusFilter(filterValue, searchParams, setSearchParams)
    } else if (key) {
        toggleArrFilter(filterValue, key, searchParams, setSearchParams)
    }
}
const onClick = (event, chartRef, data, type, searchParams, setSearchParams) => {
    const element = getElementAtEvent(chartRef.current, event);
    if (!element || element.length < 1)
        return;

    const delim = ' By '
    const isStacked = type.indexOf(delim) > 0;
    const barLabel = data.labels[element[0].index];
    const stackLabel = isStacked ? data.datasets[element[0].datasetIndex].label : null;
    const stackFilter = isStacked ? type.split(delim)[1] : null;
    const barFilter = isStacked ? type.split(delim)[0] : type;

    SetFilters(barFilter, barLabel, searchParams, setSearchParams);
    if (stackFilter != null)
        SetFilters(stackFilter, stackLabel, searchParams, setSearchParams);

}

export const ProjectBarChart = ({}) => {
    const [initializing, setInitializing] = useState(true);
    const BusyMessage = useBusyMessage(CHART_ID);
    const data = useChartData();
    const type = useChartType();
    const options = useChartOptions();
    const [searchParams, setSearchParams] = useSearchParams();
    const chartRef = useRef();

    useLayoutEffect(() => {
        AddQueueMessage(CHART_ID, 'init-chart', 'Retrieving Chart Data...');
    }, []);

    useEffect(() => {
        const paramType = searchParams.get('ChartType');
        if ((!paramType || paramType.length < 1) && type !== SUSPENSE && !!type) {
            searchParams.set('ChartType', type)
            setSearchParams(searchParams);
        } else if(paramType && type !== paramType) {
            SetChartType(paramType);
        }
    }, [searchParams, type])

    useEffect(() => {
        if ([type, data, options].indexOf(SUSPENSE) < 0) {
            RemoveQueueMessage(CHART_ID, 'init-chart');
            setInitializing(false);
        }
    }, [type, data, options])


    if (BusyMessage || initializing)
        return (
            <Stack direction="vertical" className="mx-auto my-auto" 
            style={{width: '100%', height: '100%', opacity: 0.5, justifyContent: 'center'}}>
                <BreedingRhombusSpinner color='gray' size={150} className="mx-auto" style={{opacity:0.7}}/> 
                <div style={{fontWeight: 300, textAlign: 'center', fontSize: '25px', marginTop: '50px'}}>
                    {BusyMessage?.message}
                </div>
            </Stack>
    )

    return (
        <div id="pm-charts" style={{paddingTop: 20}}>
            <Dropdown options={ChartTypes} value={type} className="pm-chart-dropdown"
                onChange={(e) => SetChartSearchParams(e.value, searchParams, setSearchParams)}/>
            <Bar ref={chartRef} data={data} options={options}  redraw={true}
            onClick={(evt) => onClick(evt, chartRef, data, type, searchParams, setSearchParams)}
            style={{paddingTop: 20}}/>
        </div>
    )
}