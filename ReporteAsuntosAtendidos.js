import React, { Component, Fragment } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Query } from 'react-apollo';
import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';
import es from 'date-fns/locale/es';
import DatePicker from "react-datepicker";

import { QUERY_PRUEBA_ASUNTOS_ATENDIDOS } from '../../queries';

import '../css/Header.css';

const client = new ApolloClient({
	cache: new InMemoryCache({
		addTypename: false
    }),    
    //uri: 'http://172.29.100.137:5000/?token=secreto',
    uri: 'https://dgti-ees-conciliaciones-rep-api-staging.k8s.funcionpublica.gob.mx/?token=secreto',
    onError: ({ networkError, graphQLErrors }) => {
		console.log('graphQLErrors', graphQLErrors);
		console.log('networkError', networkError);
	}
});

let query = '';
let variables = {};

class ReporteAsuntosAtendidos extends Component {
    
    constructor(props) {
        super(props);
       
        this.state = { 
            paginaRegreso: `/${this.props.match.params.pagina}`,
            fechaI: '',
            fechaF: new Date(),
            FiltrofechaI: '',
            FiltrofechaF: '',
            yearI: new Date().getFullYear(),
            yearF: new Date().getFullYear(),
            vardependencia_conciliadora:  JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id,
        }

        sessionStorage.setItem('fecha_inicio', '');
        sessionStorage.setItem('fecha_fin', '');

    }

    filtroFechaI = date => {
        if (date == null) {
            this.setState({ FiltrofechaI: '' });
            this.setState({ fechaI: '' });
            this.setState({ yearI: new Date().getFullYear() });
            sessionStorage.setItem('fecha_inicio', '');
        } else {
            let d = date.getDate();
            let m = date.getMonth()+1;
            let y = date.getFullYear();
            let fecha = ''+(d<=9?'0'+d:d)+'/'+(m<=9?'0'+m:m)+'/'+y;
            sessionStorage.setItem('fecha_inicio', fecha);
            this.setState({FiltrofechaI: fecha});
            this.setState({fechaI: date});
            this.setState({yearI: y});
        }
    }

    filtroFechaF = date => {
        if (date == null) {
            this.setState({ FiltrofechaI: '' });
            this.setState({ fechaF: new Date() });
            this.setState({ yearI: new Date().getFullYear() });
            sessionStorage.setItem('fecha_fin', '');
        } else {
            let d = date.getDate();
            let m = date.getMonth()+1;
            let y = date.getFullYear();
            let fecha = ''+(d<=9?'0'+d:d)+'/'+(m<=9?'0'+m:m)+'/'+y;
            sessionStorage.setItem('fecha_fin', fecha);
            this.setState({FiltrofechaF: fecha});
            this.setState({fechaF: date});
            this.setState({yearF: y});
        }
    }

    render() {

        query = QUERY_PRUEBA_ASUNTOS_ATENDIDOS;
        variables = { fecha_inicio: this.state.FiltrofechaI, fecha_fin: this.state.FiltrofechaF, dependencia_conciliadora: this.state.vardependencia_conciliadora };

        return (
            <Fragment>
                <div class="row justify-content-center">
                    
                    <button type="button" 
                        className="btn btn-danger d-block d-md-inline-block mr-2 botonCancelar"
                        onClick = { () => {
                            sessionStorage.removeItem('fecha_inicio', '');
                            sessionStorage.removeItem('fecha_fin', '');
                            this.props.history.push(`${this.state.paginaRegreso}`);
                        }}>
                        Cerrar 
                    </button>
                </div>

                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label>Fecha Inicio:</label>
                        <br/>
                        <DatePicker
                            selected = {this.state.fechaI}
                            dateFormat = "dd/MM/yyyy"
                            locale = {es}
                            className = "form-control readOnlyCur"
                            placeholderText = "Fecha inicio"
                            onChange = {this.filtroFechaI}
                        />
                    </div>
                    <div className="form-group col-md-6">
                        <label>Fecha Fin:</label>
                        <br/>
                        <DatePicker
                            selected = {this.state.fechaF}
                            dateFormat = "dd/MM/yyyy"
                            locale = {es}
                            className = "form-control readOnlyCur"
                            placeholderText = "Fecha fin"
                            onChange = {this.filtroFechaF}
                        />
                    </div>
                </div>

                    <h2 class="text-center TituloPagina"> Reporte de asuntos atendidos </h2>
                    <div class="col-md-11 mar1RemAut">
                        <Query client={client} query={query} variables={variables} pollInterval={ 2000 }>
                            {({ loading, error, data, startPolling, stopPolling }) => {
                                
                            if(loading) return "Cargando...";
                            if(error) return ` Error: ${error.message}`;

                            let year = this.state.yearI === this.state.yearF ? `${this.state.yearI}`: `${this.state.yearI} - ${this.state.yearF}`;

                            let recibidas = data.Asuntos_Atendidos_Primero[0].recibidas === 0 ? '0' :
                                <Link to={`/reporteAsuntosCom/ASUNTOS_RECIBIDAS`}>
                                    {data.Asuntos_Atendidos_Primero[0].recibidas}
                                </Link>
                            
                            let concluidas = data.Asuntos_Atendidos_Primero[0].concluidas === 0 ? '0' :
                                <Link to={`/reporteAsuntosCom/ASUNTOS_CONCLUIDAS`}>
                                    {data.Asuntos_Atendidos_Primero[0].concluidas}
                                </Link>

                            let en_tramite = data.Asuntos_Atendidos_Primero[0].en_tramite === 0 ? '0' :
                                <Link to={`/reporteAsuntosCom/ASUNTOS_TRAMITE`}>
                                    {data.Asuntos_Atendidos_Primero[0].en_tramite}
                                </Link>

                            let acuerdo_voluntades = data.Asuntos_Atendidos[0].acuerdo_voluntades === 0 ? '0' :
                                <Link to={`/reporteAsuntosCom/ASUNTOS_VOLUNTADES`}>
                                    {data.Asuntos_Atendidos[0].acuerdo_voluntades}
                                </Link>

                            let a_salvo_derechos = data.Asuntos_Atendidos[0].a_salvo_derechos === 0 ? '0' :
                                <Link to={`/reporteAsuntosCom/ASUNTOS_DERECHO`}>
                                    {data.Asuntos_Atendidos[0].a_salvo_derechos}
                                </Link>

                            let otras = data.Asuntos_Atendidos[0].otras === 0 ? '0' :
                                <Link to={`/reporteAsuntosCom/ASUNTOS_OTROS`}>
                                    {data.Asuntos_Atendidos[0].otras}
                                </Link>

                            return(
                                <Fragment>
                                    <table class="styTableA">
                                        <thead class="borC">
                                            <tr class="stThA">
                                                <td class="text-center borR" rowspan="2"> CONCILIACIONES </td>
                                                <td class="text-center"> {year} </td>
                                            </tr>
                                            <tr class="stThA">
                                                <td class="text-center borT"> DGCSCP </td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td class="text-center styTdA"> RECIBIDAS </td>
                                                <td class="text-center styTdA"> {recibidas} </td>
                                            </tr>
                                            <tr>
                                                <td class="text-center styTdA"> CONCLUIDAS </td>
                                                <td class="text-center styTdA"> {concluidas} </td>
                                            </tr>
                                            <tr>
                                                <td class="text-center styTdA"> EN TRAMITE </td>
                                                <td class="text-center styTdA"> {en_tramite} </td>
                                            </tr>
                                            <tr class="stThA">
                                                <td class="text-center styTdA"> SENTIDO DE CONCLUSIÓN </td>
                                                <td class="text-center styTdA"> DGCSCP </td>
                                            </tr>
                                            <tr>
                                                <td class="text-center styTdA"> ACUERDO DE VOLUNTADES </td>
                                                <td class="text-center styTdA"> {acuerdo_voluntades} </td>
                                            </tr>
                                            <tr>
                                                <td class="text-center styTdA"> A SALVO DERECHOS </td>
                                                <td class="text-center styTdA"> {a_salvo_derechos} </td>
                                            </tr>
                                            <tr>
                                                <td class="text-center styTdA"> OTRAS </td>
                                                <td class="text-center styTdA"> {otras} </td>
                                            </tr>
                                            <tr  class="stThA">
                                                <td class="text-center styTdA"> TOTAL </td>
                                                <td class="text-center styTdA"> { data.Asuntos_Atendidos[0].otras + data.Asuntos_Atendidos[0].a_salvo_derechos + data.Asuntos_Atendidos[0].acuerdo_voluntades } </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </Fragment>
                            )
                            }}
                        </Query>                                           
                    </div>
            </Fragment>            
        );
    }
}


export default withRouter(ReporteAsuntosAtendidos);
