import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {states} from './states.js';

function State(props)
{
    var geoms, path = [];
    
    if(props.geometry.type === 'MultiPolygon') {
        geoms = props.geometry.coordinates;
    } else if(props.geometry.type === 'Polygon') {
        geoms = [props.geometry.coordinates];
    }
    
    console.log(props.properties.NAME);
    
    for(var part, i = 0; i < geoms.length; i++)
    {
        part = geoms[i];
        
        for(var ring, j = 0; j < part.length; j++)
        {
            ring = part[j];
            path = path.concat(['M', ring[0][0], ring[0][1]]);

            for(var coord, k = 1; k < ring.length; k++)
            {
                coord = ring[k];
                path = path.concat(['L', coord[0], coord[1]]);
            }
            
            path.push('Z');
        }
    }
    
    return <path d={path.join(' ')}
        vectorEffect="non-scaling-stroke" fillRule='evenodd'
        style={{fill: '#ff9', stroke: '#f90'}} />;
}

class States extends React.Component
{
    constructor(props)
    {
        super(props)
        
        this.state = {states: states.features};
    }

    render()
    {
        var states = [];
        
        for(var feature, i = 0; i < this.state.states.length; i++)
        {
            feature = this.state.states[i];
            states.push(<State key={feature.properties['ISO3166_2']}
                properties={feature.properties} geometry={feature.geometry} />);
        }
        
        return <svg xmlns="http://www.w3.org/2000/svg" style={{
            position: 'fixed', left: 0, top: 0, width: '100%', height: '100%'
            }}>
            <g id="states" transform="matrix(.2 0 0 -.2 500 650)">
                {states}
            </g>
            </svg>
    }
}

// ========================================

ReactDOM.render(
  <States />,
  document.getElementById('root')
);

