import React, { Component, Fragment } from 'react';
import { withRouter, Redirect } from 'react-router-dom';

import BusquedaExp from './BusquedaExp';
import Resultado from './Resultado';

class Expedientes extends Component {

	state = {
        numExpediente: ''
	}

    buscarExp = (numExpediente) => {	
        this.setState({
            paginador:{
                ...this.state.paginador
            }
            ,numExpediente
        })		
	}

    render() {
        let usuario = (JSON.parse(this.props.session)) ? JSON.parse(this.props.session).usuario.usuario: null;
        let rol = (JSON.parse(this.props.session)) ? JSON.parse(this.props.session).apis[0].roles[0].rol : null;
        if(rol === null) return <Redirect to="/login"/>;

        return (

            <Fragment>
                <br />
                <h2 className="text-center TituloPagina">Expedientes</h2>
                <br />    
                <BusquedaExp buscarExp={this.buscarExp} />                    
                <br />
                <Resultado numExpediente={this.state.numExpediente} rol={rol} usuario={usuario} />                    
            </Fragment>
        )
    }
};

export default withRouter(Expedientes);