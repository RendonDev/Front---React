import React, { Component, Fragment } from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { Query, Mutation } from 'react-apollo';
import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';

import Select from 'react-select';

import { NUEVA_SOLICITUD } from '../../mutations';
import { QUERY_CATALOGO_GENERICO, QUERY_CATALOGO_POR_ID_PADRE } from '../../queries';

import '../css/Header.css';

import Exito from '../Alertas/Exito';

const client = new ApolloClient({
	cache: new InMemoryCache({
		addTypename: false
    }),        
    uri: 'https://dgti-ees-conciliaciones-api-staging.k8s.funcionpublica.gob.mx',
    onError: ({ networkError, graphQLErrors }) => {
		console.log('graphQLErrors', graphQLErrors);
		console.log('networkError', networkError);
    }    
});

class NuevaSolicitud extends Component {

    state = { 
        solicitud: {
            solicitante: ''
            ,proveedor: ''
            ,id_entidad: ''
            ,dependencia: ''
            ,id_sector: ''
            ,id_dependencia: ''
            ,monto: ''
            ,id_motivo: ''  
            ,id_proceso: 1
            ,usuario: ''
            ,dependencia_registro: ''
            ,dependencia_conciliadora: ''
        }
        ,error : false
        ,motivos: []
        ,msgExito : false
        ,activaDependencia : false
        ,activaSector : false
        ,dependencia: JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.dependencia        
        ,dependencia_conciliadora : JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id
    }
    
    seleccionarEntidad = (entidad) => {
        const { id } = entidad;
        this.setState({
            solicitud:{
                ...this.state.solicitud,
                id_entidad: Number(id)
            }
        }) 

        if((Number(id) === 12) || (Number(id) === 13)){
            this.state.activaDependencia = true;
            this.state.activaSector = false;
        }else{
            this.state.activaSector = true;
            this.state.activaDependencia = false;
        }  
    }
    seleccionarSector = (sector) => {
        const { id } = sector;
        this.setState({
            solicitud:{
                ...this.state.solicitud,
                id_sector: Number(id)
            }
        })        
    }
    seleccionarDependencia = (dependencia) => {
        const { id } = dependencia;     
        this.setState({
            solicitud:{
                ...this.state.solicitud,
                id_dependencia: Number(id)
            }
        })        
    }
    
    nuevoCampo = () => {
        this.setState({
            motivos: this.state.motivos.concat([{ id_motivo: ''}])
        })
    }
    quitarCampo = i => () => {
        this.setState({
            motivos: this.state.motivos.filter(( id_motivo, index ) => i !== index)
        })
    }
    leerCampo = i => e => {
        const nuevoMotivo = this.state.motivos.map(( id_motivo, index ) => {
            const { id } = e;            
            if(i !== index) return id_motivo;
            return {
                ...this.state.solicitud.id_motivo,
                id_motivo: Number(id)
            }
        });
        this.setState({
            ...this.state.motivos,
            motivos: nuevoMotivo
        })
    }
    validaMotivo = () => {
        let res = false;
        if(this.state.motivos.length === 0) {
            res = true
        }else{
            this.state.motivos.forEach(function(element) {
                const { id_motivo} = element;
                if(id_motivo === ''){
                    res = true
                }else{
                    res = false;
                    return 0;
                }
            });
        }        
        return res;
    }
    
    render() {

        console.log("ID:",this.state.dependencia_conciliadora);

        let rol = (JSON.parse(this.props.session)) ? JSON.parse(this.props.session).apis[0].roles[0].rol : null;
        if(rol === null) return <Redirect to="/login"/>;

        const redireccion = (rol !== 'ADMINISTRADOR' && rol !== 'OFICIALIA') ? <Redirect to="/principal"/> : '';

        const {error, msgExito } = this.state;
        
        let respuesta = (error) ? <p className="alert alert-danger p-3 text-center">
                Todos los campos marcados con * son obligatorios </p> : '';    
        let mensaje = (msgExito) ?  <Exito pagina="/solicitud" /> : '';
        let campoObligatorio = <label className="CampoObligatorio mr-md-1">* </label>
        
        let variablesSector = { catalogo: 'CONC_SECTOR'};
        let variablesEntidad = { catalogo: 'CONC_ENTIDAD_FEDERATIVA'};
        let variablesDependencia = { id_padre: String(this.state.solicitud.id_sector)};
        let variablesMotivo = { catalogo: 'CONC_MOTIVO'};

        const campoDependencia = this.state.activaDependencia !== true ? '' : 
            <div className = "form-group col-md-6">
                {campoObligatorio}
                <label>Dependencia o Entidad:</label>
                <input type="text" 
                    className="form-control" 
                    placeholder="Dependencia o Entidad"
                    onChange={e => {
                        this.setState({
                            solicitud:{
                                ...this.state.solicitud,
                                dependencia: e.target.value
                            }
                        })
                    }}
                />
            </div>;

        const combosDependencia = this.state.solicitud.id_sector === '' ? '' : 
            <div className="form-group col-md-6">
                {campoObligatorio}
                <label>Dependencia o Entidad:</label>
                <Query query={QUERY_CATALOGO_POR_ID_PADRE} variables={variablesDependencia}  >
                    {({ loading, error, data }) => {                                                
                        if(loading) return 'Cargando...';
                        if(error) return `Error ${error.message}`;
                        return(
                            <Select 
                                onChange={this.seleccionarDependencia} 
                                options={data.CatGenericoListByIdPadre} 
                                placeholder={'Elegir...'}
                                getOptionValue = {(options) => options.id}
                                getOptionLabel = {(options) => options.descripcion}
                            />
                        )
                    }}
                </Query>
            </div>;
        
        
        const combosSectorDep = this.state.activaSector !== true ? '' : 
            <div className="form-row">
                <div className="form-group col-md-6">
                    {campoObligatorio}
                    <label>Sector:</label>
                    <Query query={QUERY_CATALOGO_GENERICO} variables={variablesSector}  >
                        {({ loading, error, data }) => {                                                
                            if(loading) return 'Cargando...';
                            if(error) return `Error ${error.message}`;
                            return(
                                <Select 
                                    onChange={this.seleccionarSector} 
                                    options={data.CatGenericoListByCat} 
                                    placeholder={'Elegir...'}
                                    getOptionValue = {(options) => options.id}
                                    getOptionLabel = {(options) => options.descripcion}
                                />
                            )
                        }}
                    </Query>
                </div>    
                {combosDependencia}
            </div>;
        
        return(
            
            <Fragment>

                {redireccion}

                {mensaje}
            
                <h2 className="text-center TituloPagina">Nueva Solicitud</h2>

                {respuesta}

                <div className="row justify-content-center">

                    <div className="col-md-8 m-3 Obligatorio">
                        <label>Todos los campos marcados con * son obligatorios</label>
                    </div>

                    <Mutation 
                        client = {client}
                        mutation = {NUEVA_SOLICITUD}
                        onCompleted = {(loading, error, res) => 
                            this.setState({
                                ...this.state,
                                msgExito: true
                            })
                        }
                        ignoreResults = {false}
                    >    
                        {(crearSolicitud, {loading, data}) => {
                            if(typeof data !== "undefined"){                                
                                localStorage.removeItem('idSolicitudActual', '');
                                localStorage.setItem('idSolicitudActual', data.crearSolicitud.id_expediente);                                
                            }

                            return(
                            <form className="col-md-8 m-3" 
                                onSubmit = {
                                    e => {
                                        e.preventDefault();

                                        const {
                                            solicitante
                                            ,proveedor
                                            ,id_entidad
                                            ,dependencia
                                            ,id_sector
                                            ,id_dependencia
                                            ,monto
                                            ,id_proceso
                                            ,usuario
                                            ,dependencia_registro
                                            ,dependencia_conciliadora} = this.state.solicitud;

                                        const {motivos} = this.state;

                                        let SolicitudInput = null;

                                        if(solicitante === '' || proveedor === '' || id_entidad === '' || monto === '' || dependencia_registro === '' || dependencia_conciliadora === '' || this.validaMotivo() ){
                                            this.setState({
                                                error: true
                                            });
                                            return;
                                        }
                                        
                                        if(this.state.activaDependencia){
                                            SolicitudInput = {
                                                solicitante
                                                ,proveedor
                                                ,id_entidad
                                                ,dependencia
                                                ,id_proceso
                                                ,monto
                                                ,usuario
                                                ,motivos
                                                ,dependencia_registro
                                                ,dependencia_conciliadora
                                            };
    
                                            if( dependencia === '' ){
                                                this.setState({
                                                    error: true
                                                });
                                                return;
                                            }
                                        }

                                        if(this.state.activaSector){
                                            SolicitudInput = {
                                                solicitante
                                                ,proveedor
                                                ,id_entidad
                                                ,id_sector
                                                ,id_dependencia
                                                ,monto
                                                ,id_proceso
                                                ,usuario
                                                ,motivos
                                                ,dependencia_registro
                                                ,dependencia_conciliadora
                                            };
                                            
                                            if( id_sector === '' || id_dependencia === '' ){
                                                this.setState({
                                                    error: true
                                                });
                                                return;
                                            }
                                        }

                                        this.setState({
                                            error: false
                                        })

                                        crearSolicitud({
                                            variables: { SolicitudInput }
                                        })
                                    }
                                } >

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        {campoObligatorio}
                                        <label>Solicitante:</label>

                                        <fieldset className="form-group">
                                            <div className="row">
                                                <div className="col-sm-10">
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="radio" 
                                                            name="gridRadios" id="gridRadios1" value="1"  
                                                            onChange={e => {
                                                                this.setState({
                                                                    solicitud:{
                                                                        ...this.state.solicitud,
                                                                        solicitante: Number(e.target.value),
                                                                        usuario: JSON.parse(this.props.session).usuario.usuario,
                                                                        dependencia_registro: this.state.dependencia,
                                                                        dependencia_conciliadora: this.state.dependencia_conciliadora
                                                                    }
                                                                })
                                                            }}   
                                                        />
                                                        <label className="form-check-label" htmlFor="gridRadios1">
                                                            Proveedor o Contratista
                                                        </label>                                                        
                                                    </div>
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="radio" 
                                                            name="gridRadios" id="gridRadios2" value="2"
                                                            onChange={e => {
                                                                this.setState({
                                                                    solicitud:{
                                                                        ...this.state.solicitud,
                                                                        solicitante: Number(e.target.value),
                                                                        usuario: JSON.parse(this.props.session).usuario.usuario
                                                                    }
                                                                })
                                                            }}   />
                                                        <label className="form-check-label" htmlFor="gridRadios2">
                                                            Dependencia o Entidad
                                                        </label>
                                                    </div>                                                
                                                </div>
                                            </div>
                                        </fieldset>
                                    </div>
                                    <div className="form-group col-md-6">
                                        {campoObligatorio}
                                        <label>Proveedor o Contratista:</label>
                                        <input type="text" 
                                            className="form-control" 
                                            placeholder="Proveedor o Contratista"
                                            onChange={e => {
                                                this.setState({
                                                    solicitud:{
                                                        ...this.state.solicitud,
                                                        proveedor: e.target.value
                                                    }
                                                })
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        {campoObligatorio}
                                        <label>Entidad Federativa:</label>
                                        <Query query={QUERY_CATALOGO_GENERICO} variables={variablesEntidad}  >
                                            {({ loading, error, data }) => {                                                
                                                if(loading) return 'Cargando...';
                                                if(error) return `Error ${error.message}`;
                                                return(
                                                    <Select 
                                                        onChange={this.seleccionarEntidad} 
                                                        options={data.CatGenericoListByCat} 
                                                        placeholder={'Elegir...'}
                                                        getOptionValue = {(options) => options.id}
                                                        getOptionLabel = {(options) => options.descripcion}
                                                    />
                                                )
                                            }}
                                        </Query>
                                    </div>
                                    <div className="form-group col-md-6">
                                        {campoObligatorio}
                                        <label>Monto en Conciliación:</label>
                                        <input type="text" 
                                            className="form-control" 
                                            placeholder="Proveedor o Contratista"
                                            onChange={e => {
                                                this.setState({
                                                    solicitud:{
                                                        ...this.state.solicitud,
                                                        monto: Number(e.target.value)
                                                    }
                                                })
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    {campoDependencia}
                                </div>

                                {combosSectorDep}

                                <div className="form-row">
                                    {this.state.motivos.map((input, index) => (
                                        <div key={index} className="form-group col-md-12">
                                            {campoObligatorio}
                                            <label>Motivo { index+1 }:</label>
                                            <div  className="form-row">
                                                <div className="form-group col-md-10">
                                                <Query query={QUERY_CATALOGO_GENERICO} variables={variablesMotivo}  >
                                                        {({ loading, error, data }) => {                                                
                                                            if(loading) return 'Cargando...';
                                                            if(error) return `Error ${error.message}`;
                                                            return(
                                                                <Select 
                                                                    onChange={this.leerCampo(index)} 
                                                                    options={data.CatGenericoListByCat} 
                                                                    placeholder={'Elegir...'}
                                                                    getOptionValue = {(options) => options.id}
                                                                    getOptionLabel = {(options) => options.descripcion}
                                                                />
                                                            )
                                                        }}
                                                    </Query>
                                                </div>
                                                <div className="form-group col-md-2">
                                                    <button 
                                                        onClick={this.quitarCampo(index)}
                                                        type="button"
                                                        className="btn btn-danger botonEliminar">
                                                        &times; Eliminar                                                    
                                                    </button>
                                                </div>
                                            </div>
                                        </div>                                  
                                    ))}
                                    
                                    <div className="form-group d-flex justify-content-center col-md-12">
                                        {campoObligatorio}
                                        <button 
                                            onClick={this.nuevoCampo}        
                                            type="button"
                                            className="btn btn-warning botonAgregar">
                                            + Agregar Motivo
                                        </button>
                                    </div>                                    
                                </div>

                                <div className="float-right">
                                    <button type="submit" 
                                        className="btn btn-success mr-md-2 mb-2 mb-md-0 botonGuardar">
                                        Guardar
                                    </button>                                    
                                    <button 
                                        type="button" 
                                        className="btn btn-danger d-block d-md-inline-block mr-2 botonCancelar"
                                        onClick = { () => {
                                            this.props.history.push('/')
                                        }}>
                                        Cancelar 
                                    </button>
                                </div>
                            </form>
                            )}}
                    </Mutation>
                </div>
            </Fragment>
        );
    }
}

export default withRouter(NuevaSolicitud);