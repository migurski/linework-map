import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {states} from './states.js';

class State extends React.Component
{
    constructor(props)
    {
        super(props)

        var geoms, path = [];
    
        if(props.geometry.type === 'MultiPolygon') {
            geoms = props.geometry.coordinates;
        } else if(props.geometry.type === 'Polygon') {
            geoms = [props.geometry.coordinates];
        }
    
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
        
        this.path = path.join(' ');
    }
    
    render()
    {
        var props = this.props;
    
        return <path d={this.path}
            onClick={() => { props.states.selectState(props.properties.NAME) }}
            onMouseOver={() => { props.states.hoverState(props.properties.NAME) }}
            onMouseOut={() => { props.states.hoverState(undefined) }}
            vectorEffect="non-scaling-stroke" fillRule='evenodd'
            style={{cursor: 'pointer', fill: (props.hovered ? '#f09' : '#ff9'), stroke: '#f90'}} />;
    }
}

function get_matrix(width, height, bbox)
{
    var padding = 10, maxscale = .5;

    var _xscale = (width - padding*2) / (bbox[2] - bbox[0]),
        _yscale = (height - padding*2) / (bbox[3] - bbox[1]),
        xscale = Math.min(_xscale, _yscale, maxscale),
        yscale = -Math.min(_xscale, _yscale, maxscale);
    
    var _x = bbox[2]/2 + bbox[0]/2,
        _y = bbox[3]/2 + bbox[1]/2,
        x = width/2 - xscale * _x,
        y = height/2 - yscale * _y;
    
    return 'matrix(' + [xscale, 0, 0, yscale, x, y].join(' ') + ')';
}

class States extends React.Component
{
    constructor(props)
    {
        super(props)
        
        this.state = {
            states: props.states.features,
            bbox: props.states.bbox,
            selected: undefined,
            hovered: undefined
            };
    }
    
    selectState(name)
    {
        this.setState({selected: name});
    }

    hoverState(name)
    {
        this.setState({hovered: name});
    }

    render()
    {
        var states = [],
            matrix = get_matrix(window.innerWidth, window.innerHeight, this.state.bbox);
        
        for(var feature, i = 0; i < this.state.states.length; i++)
        {
            feature = this.state.states[i];
            states.push(<State key={feature.properties['ISO3166_2']}
                hovered={this.state.hovered === feature.properties.NAME}
                properties={feature.properties} geometry={feature.geometry}
                states={this} />);
            
            if(this.state.selected === feature.properties.NAME)
            {
                matrix = get_matrix(window.innerWidth, window.innerHeight, feature.bbox);
            }
        }
        
        return <svg xmlns="http://www.w3.org/2000/svg" style={{
            position: 'fixed', left: 0, top: 0, width: '100%', height: '100%'}}>
            <rect onClick={() => { this.selectState(false) }} style={{
                width: '100%', height: '100%', fill: '#fff'}} />
            <g id="states" transform={matrix}>
                {states}
            </g>
            </svg>
    }
}

// ========================================

ReactDOM.render(
  <States states={states} />,
  document.getElementById('root')
);

