import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {states} from './states.js';

// Colors:
// http://chromatron.s3-website-us-east-1.amazonaws.com/#eNpNzssKwjAQBdB/uW6ziHknvyIuNGklGFqoCErJvxvyoM5mNnPm3h1+Tev2grvsiAGOEswxJTicqJFMTyD4wDEtCL5lK0uwwRmaSQPnP6C4VKoDJSvgVFUghR2CHYIxORs/IliPaMLwAfgByjtrdQNc9E62AU3zleB+88/Htr6XUCvVKfdxCVMxIv8ABZY9CA==

// t: current time, b: begInnIng value, c: change In value, d: duration
function ease(t, b, c, d)
{
    t=t/d-1;
    return c*((t)*t*t + 1) + b;
}

function get_geometry_path(geometry)
{
    var geoms, path = [];

    if(geometry.type === 'MultiPolygon') {
        geoms = geometry.coordinates;
    } else if(geometry.type === 'Polygon') {
        geoms = [geometry.coordinates];
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
    
    return path.join(' ');
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
    
    return [xscale, 0, 0, yscale, x, y];
}

class State extends React.Component
{
    constructor(props)
    {
        super(props)
        this.path = get_geometry_path(props.geometry);
    }
    
    render()
    {
        var props = this.props;
    
        return <path d={this.path}
            onClick={() => { props.states.selectState(props.properties.ISO3166_2) }}
            onMouseOver={() => { props.states.hoverState(props.properties.ISO3166_2) }}
            onMouseOut={() => { props.states.hoverState(undefined) }}
            vectorEffect="non-scaling-stroke" fillRule='evenodd'
            style={{cursor: 'pointer', fill: (props.hovered ? '#306997' : '#08527E'), stroke: '#225f8c'}} />;
    }
}

class States extends React.Component
{
    constructor(props)
    {
        super(props)
        
        this.state = {
            states: props.states.features,
            bbox: props.states.bbox,
            selected: null,
            hovered: null,

            moving: false,
            move_now: null,
            move_start: {matrix: [], time: null},
            move_end: {matrix: [], time: null}
            };
    }
    
    selectState(ISO3166_2)
    {
        if(this.state.moving) { return }
        
        var move_start = {time: (new Date()).getTime(), matrix: this.findMatrix(this.state.selected)},
            move_end = {time: (new Date()).getTime() + 500, matrix: this.findMatrix(ISO3166_2)};
        
        this.setState({selected: ISO3166_2,
            moving: true, move_now: (new Date()).getTime(),
            move_start: move_start, move_end: move_end});
    }

    hoverState(ISO3166_2)
    {
        this.setState({hovered: ISO3166_2});
    }
    
    findMatrix(ISO3166_2)
    {
        for(var feature, i = 0; i < this.state.states.length; i++)
        {
            feature = this.state.states[i];
            if(feature.properties.ISO3166_2 === ISO3166_2)
            {
                return get_matrix(window.innerWidth, window.innerHeight, feature.bbox);
            }
        }
        
        return get_matrix(window.innerWidth, window.innerHeight, this.state.bbox);
    }
    
    moveOn()
    {
        if((new Date()).getTime() < this.state.move_end.time) {
            this.setState({moving: true, move_now: (new Date()).getTime()});
        
        } else {
            this.setState({moving: false, move_now: null});
        }
    }

    render()
    {
        var states = [],
            matrix = this.findMatrix(this.state.selected);
        
        for(var feature, i = 0; i < this.state.states.length; i++)
        {
            feature = this.state.states[i];
            states.push(<State key={feature.properties.ISO3166_2}
                hovered={this.state.hovered === feature.properties.ISO3166_2}
                properties={feature.properties} geometry={feature.geometry}
                states={this} />);
        }
        
        if(this.state.moving)
        {
            var component = this,
                t = this.state.move_now - this.state.move_start.time,
                d = this.state.move_end.time - this.state.move_start.time,
                m1 = this.state.move_start.matrix,
                m2 = this.state.move_end.matrix;
            
            matrix = [
                ease(t, m1[0], m2[0] - m1[0], d), ease(t, m1[1], m2[1] - m1[1], d),
                ease(t, m1[2], m2[2] - m1[2], d), ease(t, m1[3], m2[3] - m1[3], d),
                ease(t, m1[4], m2[4] - m1[4], d), ease(t, m1[5], m2[5] - m1[5], d)
                ];
        
            window.requestAnimationFrame(() => { component.moveOn() });
        }
        
        var svg = <svg xmlns="http://www.w3.org/2000/svg" style={{
            position: 'fixed', left: 0, top: 0, width: '100%', height: '100%'}}>
            <rect onClick={() => { this.selectState(false) }} style={{
                width: '100%', height: '100%', fill: '#063566'}} />
            <g id="states" transform={'matrix('+matrix.join(' ')+')'}>
                {states}
            </g>
            </svg>;
        
        return svg;
    }
}

// ========================================

ReactDOM.render(
  <States states={states} />,
  document.getElementById('root')
);

