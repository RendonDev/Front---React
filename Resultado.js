import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom';
import { Query } from 'react-apollo';
import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';

import { QUERY_SOLICITUD, QUERY_EXPEDIENTES, QUERY_EXPEDIENTES_TODOS, QUERY_EXPEDIENTES_DIRECTOR, QUERY_EXPEDIENTES_CONCILIADOR } from '../../queries';

import Paginador from '../Paginador';
import MenuProcesos from '../MenuProcesos';
import DescripcionCat from '../DescripcionCat/DescripcionCat';
import DescripcionProceso from '../DescripcionCat/DescripcionProceso';

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

class Resultado extends Component {
		
	limite = 5;

	state = {
		paginador:{
			offset: 0,
			actual: 1			
		},
		dependencia: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.dependencia,		
		usuario: JSON.parse(localStorage.getItem('perfil')).usuario.usuario,
		rol: JSON.parse(localStorage.getItem('perfil')).apis[0].roles[0].rol,
		director: `${JSON.parse(localStorage.getItem('perfil')).usuario.nombre} ${JSON.parse(localStorage.getItem('perfil')).usuario.apellido1} ${JSON.parse(localStorage.getItem('perfil')).usuario.apellido2}`,
		conciliador: `${JSON.parse(localStorage.getItem('perfil')).usuario.nombre} ${JSON.parse(localStorage.getItem('perfil')).usuario.apellido1} ${JSON.parse(localStorage.getItem('perfil')).usuario.apellido2}`,
		dependencia_conciliadora: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id
	}

	paginaAnterior = () => {
        this.setState({
            paginador: {
                offset : this.state.paginador.offset - this.limite,
                actual : this.state.paginador.actual - 1
            }
        })
    }
    paginaSiguiente = () => {
        this.setState({
            paginador: {
                offset: this.state.paginador.offset + this.limite,
                actual : this.state.paginador.actual + 1
            }
        })
    }

	render(){
		
		console.log('USUARIO_MI_RENDI:', this.state.director);
		console.log('ROL:', this.state.rol);
		console.log('DEPENDENCIA', this.state.dependencia_conciliadora)
		
		var numExpediente = this.props.numExpediente;		
		let query = '';
        let variables = {};
		let campoComp = {};
        
        if (numExpediente !== '') {						
			var expEscrito = numExpediente.substr(5, numExpediente.length).replace('/', '-');			
			var iniciaCero = 0;
			for (var i = 0; i < 3; i++) {
				if(expEscrito.charAt(i) === '0'){
					iniciaCero += 1;
					
				}
				console.log("id",iniciaCero, expEscrito);
			 }
			query = QUERY_SOLICITUD;
			variables = { 
				id_expediente: expEscrito.substr(iniciaCero, expEscrito.length),
				dependencia_conciliadora: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id			
			};
		} else {
			if(this.state.rol == "ADMINISTRADOR") {
				query = QUERY_EXPEDIENTES;
				variables = { 
					limite: this.limite
					,offset: this.state.paginador.offset
					,dependencia_registro: this.state.dependencia
					,dependencia_conciliadora: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id
				};
			}
			if (this.state.rol == "OFICIALIA") {
				query = QUERY_EXPEDIENTES_TODOS;
				variables = { 
					limite: this.limite
					,offset: this.state.paginador.offset
					,dependencia_conciliadora: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id
				};	
			}
			if (this.state.rol == "DIRECTOR") {
				query = QUERY_EXPEDIENTES_DIRECTOR;
				variables = { 
					limite: this.limite
					,offset: this.state.paginador.offset
					,director: this.state.director
					,dependencia_conciliadora: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id
				};	
			}
			if (this.state.rol == "CONCILIADOR") {
				query = QUERY_EXPEDIENTES_CONCILIADOR;
				variables = { 
					limite: this.limite
					,offset: this.state.paginador.offset
					,conciliador: this.state.conciliador
					,dependencia_conciliadora: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id
				};	
			}
        }
		
		return (
			<Fragment>	
				{numExpediente !== '' && (
					<Query client={client} query = {query} variables={variables} pollInterval = { 2000 } >
						{({ loading, error, data, startPolling, stopPolling }) => {

						if(loading) return "Cargando...";
						if(error) return ` Error: ${error.message}`;

						if(data.buscarSolicitud === null) {
							return(
								<p>No hay registros</p>   
							)
						} else { 
							return (
								<Fragment>
									<table className="table">								
										<thead className="Tabla">									
											<tr className="font-weight-bold">
												<th>Expediente</th>
												<th>Dependencia</th>
												<th>Proveedor/Contratista</th>
												<th>Proceso</th>
												<th>Acciones</th> 													
											</tr>										
										</thead>									
										<tbody>
											<tr className="Registro" >
												<td>CONC/{data.buscarSolicitud.id_expediente.padStart(8, "0").replace('-', '/')}</td>
												<td>{data.buscarSolicitud.id_dependencia !== null ? <DescripcionCat id={data.buscarSolicitud.id_dependencia} /> : ''}</td>
												<td>{data.buscarSolicitud.proveedor}</td>
												<td><DescripcionProceso id={data.buscarSolicitud.id_proceso} /></td>												
												<td>
													<MenuProcesos rol={this.props.rol} pagina="expedientes" 
														expediente={data.buscarSolicitud.id_expediente} 
														proceso={data.buscarSolicitud.id_proceso} 
														fechaAlta={data.buscarSolicitud.fecha_alta} />
												</td>
											</tr>
										</tbody>
									</table>
								</Fragment>
							)
						}	
						}}
					</Query>									
				)}

				{numExpediente === '' && (

					<Query client={client} query = {query} variables={variables} pollInterval = { 2000 } >
						{({ loading, error, data, startPolling, stopPolling }) => {

						if(loading) return "Cargando...";						
						if(error) return ` Error: ${error.message}`;
						
                        if (this.state.rol === 'ADMINISTRADOR') { campoComp = data.buscarExpedientes; }
						if (this.state.rol === 'OFICIALIA') { campoComp = data.buscarExpedientes_Todos; }
						if (this.state.rol === 'DIRECTOR') { campoComp = data.buscarExpedientes_Director; }
                        if (this.state.rol === 'CONCILIADOR') { campoComp = data.buscarExpedientes_Conciliador; }

						if(campoComp.length === 0) {
							return(
								<p>No hay registros</p>   
							)
						} else { 
							return (
								<Fragment>
									
									<span className="Resultado text-left">Resultados</span>
									<span className="mt-8 d-flex float-right">Pagina {this.state.paginador.actual} 
										de {Math.ceil(data.totalExpedientes / this.limite)}</span>
		
									<table className="table">								
										<thead className="Tabla">									
											<tr className="font-weight-bold">
												<th>Expediente</th>
												<th>Dependencia</th>
												<th>Proveedor/Contratista</th>
												<th>Proceso</th>
												<th>Acciones</th> 										
											</tr>										
										</thead>									
										<tbody>
											{campoComp.map((item) => (
												<tr className="Registro" key={item.id_expediente}>
													<td>CONC/{item.id_expediente.padStart(8, "0").replace('-', '/')}</td>
													<td>{item.id_dependencia !== null ? <DescripcionCat id={item.id_dependencia} /> : item.dependencia}</td>
													<td>{item.proveedor}</td>
													<td><DescripcionProceso id={item.id_proceso} /></td>
													
													
													<td>
														<MenuProcesos rol={this.props.rol} pagina="expedientes" 
															expediente={item.id_expediente} 
															proceso={item.id_proceso} 
															fechaAlta={item.fecha_alta} />
													</td>
												</tr>
											))}  
										</tbody>
                                    </table>

									<br />

									<Paginador
                                            limite={this.limite}
                                            total={data.totalExpedientes}
                                            actual  = {this.state.paginador.actual}
                                            paginaAnterior={this.paginaAnterior}
                                            paginaSiguiente={this.paginaSiguiente}
                                        />
									<br /><br />
								</Fragment>
							)
						}	
						}}
					</Query>	
				)}
			</Fragment>
		)
	}
}

export default withRouter(Resultado);
