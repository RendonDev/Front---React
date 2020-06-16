import React, { Component, Fragment } from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { Query } from 'react-apollo';
import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';

import { QUERY_SOLICITUD } from '../../queries';

import MenuProcesos from '../MenuProcesos';
import DescripcionCat from '../DescripcionCat/DescripcionCat';

const client = new ApolloClient({
	cache: new InMemoryCache({
		addTypename: false
    }),    
    uri: 'https://dgti-ees-conciliaciones-api-staging.k8s.funcionpublica.gob.mx',
    //uri: 'https://dgti-ees-conciliaciones-api-staging.k8s.funcionpublica.gob.mx',
    onError: ({ networkError, graphQLErrors }) => {
		console.log('graphQLErrors', graphQLErrors);
		console.log('networkError', networkError);
	}
});

class Solicitud extends Component {

    state = {
        numExpediente: localStorage.getItem('idSolicitudActual')
    }

    render() {
        
        let rol = (JSON.parse(this.props.session)) ? JSON.parse(this.props.session).apis[0].roles[0].rol : null;
        if(rol === null) return <Redirect to="/login"/>;

        const redireccion = (rol !== 'ADMINISTRADOR' && rol !== 'OFICIALIA') ? <Redirect to="/principal"/> : '';

        const idCompleto = 'CONC/' + this.state.numExpediente.padStart(8, "0").replace('-', '/');

        let query,
        variables = {};
        
        query = QUERY_SOLICITUD;

        variables = { 
            id_expediente: this.state.numExpediente
        };

        return (

            <Fragment>

                {redireccion}
        
                <Query client={client} query = {query} variables={variables} pollInterval = { 1000 } >

                    {({ loading, error, data, startPolling, stopPolling }) => {                    
                        if(loading) return "Cargando...";                    
                        if(error) return ` Error: ${error.message}`;

                        const descDependencia = data.buscarSolicitud.id_dependencia !== null 
                                ? <DescripcionCat id={data.buscarSolicitud.id_dependencia} /> : 
                                <label>{data.buscarSolicitud.dependencia}</label>;
                        
                        return (

                            <Fragment>
                                
                                <div className="row justify-content-center col-md-12">
                                    <div className="form-group ">
                                        <h2 className="text-center TituloPagina">Solicitud</h2>
                                    </div>
                                    <div className="form-group col-md-2 text-center">
                                        <MenuProcesos rol={rol} pagina="solicitud" 
                                            expediente={this.state.numExpediente} 
                                            proceso={data.buscarSolicitud.id_proceso} 
                                            fechaAlta={data.buscarSolicitud.fecha_alta} />
                                    </div>                                           
                                </div>

                                <div className="row justify-content-center">
                                    <form className="col-md-6 m-3">
                                        <div className="form-row">
                                            <div className="form-group col-md-6">
                                                <label className="Solicitud">Expediente:</label>
                                                <br />
                                                <label>{idCompleto}</label>
                                            </div>
                                            <div className="form-group col-md-6">
                                                <label className="Solicitud">Estatus:</label>
                                                <br />
                                                <label>Pendiente</label>
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6">
                                                <label className="Solicitud">Proveedor o Contratista:</label>
                                                <br />
                                                <label>{data.buscarSolicitud.proveedor}</label>
                                            </div>
                                            <div className="form-group col-md-6">
                                                <label className="Solicitud">Dependencia o Entidad:</label>
                                                <br />
                                                {descDependencia}
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </Fragment>
                        )
                    }}
                </Query>
            </Fragment>
        )
    }
};

export default withRouter(Solicitud);