import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom';
import { Query } from 'react-apollo';
import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';

import { QUERY_PRUEBA_FICHA_TECNICA } from '../../queries';

import '../css/Header.css';

const url_minio = process.env.REACT_APP_URL_MINIO || 'minio-dir-sisadmin.apps.funcionpublica.gob.mx';
const access = process.env.REACT_APP_ACCESS || 'AKIAIOSFODNN7SISADMIN';
const secret = process.env.REACT_APP_SECRET || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYDIRSISADMIN';
const bucket = process.env.REACT_APP_BUCKET || 'conciliaciones-stg';

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

class FichaTecnica extends Component {

    constructor(props) {
        super(props);

        variables = { id_expediente: this.props.match.params.id, dependencia_conciliadora:  JSON.parse(localStorage.getItem('perfil')).usuario.dependencia.id }
        this.state = { 
            id_expediente: `CONC/${this.props.match.params.id.padStart(8, "0").replace('-', '/')}`,
            expediente_ca: `conclusion/CONC-${this.props.match.params.id}`,
            paginaRegreso:  `/${this.props.match.params.pagina}`,
            documentPDF: `CONC ${this.props.match.params.id.padStart(8, "0").replace('-', ' ')}.pdf`,
            documentEx: []
        }
        this.loadDocument(this.state.expediente_ca); //'conclusion/CONC-048-2019');

    }

    loadDocument = async (carpeta) => {
        console.log('CARPETA', carpeta);
        //const api = await fetch('http://172.29.100.159:5000/bucket/list', {
        await fetch('https://dgti-ees-documentos-api-staging.k8s.funcionpublica.gob.mx/bucket/list', {
            method: 'POST',
            headers: {
                'Allowed': '*',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                "url_minio": url_minio,
                "access": access,
                "secret": secret,
                "bucket": bucket,
                "path": carpeta
            })
        })
        .then(async res => await res.json())
        .then(async data =>  {
            await this.setState({ documentEx: data.documentos })
        });
    }

    convertBase64PDF = async (path) => {

        //const api = await fetch('http://172.29.100.159:5000/document/get', {
        const api = await fetch('https://dgti-ees-documentos-api-staging.k8s.funcionpublica.gob.mx/document/get', {
            method: 'POST',
            headers: {
                'Allowed': '*',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                "url_minio": url_minio,
                "access": access,
                "secret": secret,
                "bucket": bucket,
                "path": path
            })
        })
        .then(async res => await res.json())
        .then(data =>  {
            return data
        });

        let dlnk = document.getElementById('dwnldLnk');

        dlnk.download = api.file_name;
        dlnk.href = `data:application/octet-stream;base64,${api.base64_file}`;
        dlnk.click();
    }

    render() {

        query = QUERY_PRUEBA_FICHA_TECNICA;
        
        return (
            <Fragment>
                <div class="row justify-content-center">
                    
                    <button type="button" 
                        className="btn btn-danger d-block d-md-inline-block mr-2 botonCancelar"
                        onClick = { () => {
                            this.props.history.push(`${this.state.paginaRegreso}`)
                        }}>
                        Cerrar 
                    </button>
                </div>
                <div id="documentExportPdf">
                    <h2 class="text-center TituloPagina"> Expediente {this.state.id_expediente} </h2>
                    <div class="col-md-11 mar1RemAut">
                        <Query client={client} query = {query} variables = {variables} pollInterval = { 2000 } >
                            {({ loading, error, data, startPolling, stopPolling }) => {
                                
                            if(loading) return "Cargando...";						
                            if(error) return ` Error: ${error.message}`;

                            let docApi = Object.keys(this.state.documentEx).length === 0 ? '' :
                                this.state.documentEx.map(document => {
                                    return(
                                        <tr>
                                            <td class="styTd styTd40P"> Documento </td>
                                            <td class="styTd">
                                                <a id='dwnldLnk' />
                                                <button type="button"
                                                    title={document.file_name}
                                                    onClick = {() => {
                                                        this.convertBase64PDF(document.path);
                                                    }}>
                                                    {document.file_name}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                });

                            let varObjSolicitud = Object.keys(data.Solicitud).length === 0 ? '' :
                                <Fragment>
                                    <h2> Solicitud </h2>
                                    {data.Solicitud.map((item) => (
                                        <table class="styTable" key={item.proveedor}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Proveedor o Contratista </td>
                                                    <td class="styTd"> { item.proveedor } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Entidad Federativa </td>
                                                    <td class="styTd"> { item.entidad } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Sector </td>
                                                    <td class="styTd"> { item.sector } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Dependencia o Entidad </td>
                                                    <td class="styTd"> { item.desc_dependencia } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Proceso </td>
                                                    <td class="styTd"> { item.proceso } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Usuario </td>
                                                    <td class="styTd"> { item.usuario } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha Alta </td>
                                                    <td class="styTd"> {item.fecha_alta} </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>
                            
                            let varObjContrato = Object.keys(data.Contrato).length === 0 ? '' :
                                <Fragment>
                                    <h2> Contrato </h2>
                                    {data.Contrato.map((item) => (
                                        <table class="styTable" key={item.id_contrato}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Número de Contrato  </td>
                                                    <td class="styTd"> { item.numero_contrato } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Objeto del Contrato </td>
                                                    <td class="styTd"> { item.objeto_contrato } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Ley </td>
                                                    <td class="styTd"> { item.ley } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Moneda </td>
                                                    <td class="styTd"> { item.moneda } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Materia </td>
                                                    <td class="styTd"> { item.materia } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Vigencia Inicio </td>
                                                    <td class="styTd"> {item.vigenciainicio} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Vigencia Termino </td>
                                                    <td class="styTd"> {item.vigenciafin} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Plazo de Ejecución Inicio </td>
                                                    <td class="styTd"> {item.plazoinicio} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Plazo de Ejecución Termino </td>
                                                    <td class="styTd"> {item.plazofin} </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>
                            
                            let varObjConvenio_Modificatorio = Object.keys(data.Convenio_Modificatorio).length === 0 ? '' :
                                <Fragment>
                                    <h2> Convenio Modificatorio </h2>
                                    {data.Convenio_Modificatorio.map((item) => (
                                        <table class="styTable" key={item.numero_contrato}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Número de Contrato </td>
                                                    <td class="styTd"> { item.numero_contrato } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Número modificatorio </td>
                                                    <td class="styTd"> { item.numero_modificatorio } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha Alta </td>
                                                    <td class="styTd"> {item.fecha_alta} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha Modificación </td>
                                                    <td class="styTd"> {item.fecha_modificacion} </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>
                            
                            let varObjComplemento = Object.keys(data.Complemento).length === 0 ? '' :
                                <Fragment>
                                    <h2> Datos Complementarios </h2>
                                    {data.Complemento.map((item) => (
                                        <table class="styTable" key={item.asunto}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Tipo de Asunto </td>
                                                    <td class="styTd"> { item.asunto } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha de Recepción </td>
                                                    <td class="styTd"> {item.fecha_recepcion} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Procedimiento de Contratación  </td>
                                                    <td class="styTd"> { item.procedimiento } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Número de Procedimiento </td>
                                                    <td class="styTd"> { item.numero } </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>
                            
                            let varObjTurnar_Director = Object.keys(data.Turnar_Director).length === 0 ? '' :
                                <Fragment>
                                    <h2> Director </h2>
                                    {data.Turnar_Director.map((item) => (
                                        <table class="styTable" key={item.director}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Director </td>
                                                    <td class="styTd"> { item.director } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha de turno </td>
                                                    <td class="styTd"> {item.fecha_turno} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Instrucción  </td>
                                                    <td class="styTd"> { item.instruccion } </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>

                            let varObjTurnar_Conciliador = Object.keys(data.Turnar_Conciliador).length === 0 ? '' :
                                <Fragment>
                                    <h2> Conciliador </h2>
                                    {data.Turnar_Conciliador.map((item) => (
                                        <table class="styTable" key={item.conciliador}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Conciliador </td>
                                                    <td class="styTd"> { item.conciliador } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha de turno </td>
                                                    <td class="styTd"> {item.fecha_turno} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Instrucción  </td>
                                                    <td class="styTd"> { item.instruccion } </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>

                            let varObjAudiencia_Acuerdo = Object.keys(data.Audiencia_Acuerdo).length === 0 ? '' :
                                <Fragment>
                                    <h2> Audiencia y Acuerdo de Audiencia </h2>
                                    {data.Audiencia_Acuerdo.map((item) => (
                                        <table class="styTable" key={item.fecha}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha </td>
                                                    <td class="styTd"> {item.fecha} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Horario </td>
                                                    <td class="styTd"> { item.horario } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Lugar  </td>
                                                    <td class="styTd"> { item.lugar } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Acuerdo Audiencia </td>
                                                    <td class="styTd"> { item.ac_acuerdo_audi } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Causas </td>
                                                    <td class="styTd"> { item.ac_causas } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Cumplio UNCP </td>
                                                    <td class="styTd"> { item.ac_esuncp } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Descripción unidad de normatividad de contratación </td>
                                                    <td class="styTd"> { item.ac_descripcionuncp } </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>

                            let varObjConclusion = Object.keys(data.Conclusion).length === 0 ? '' :
                                <Fragment>
                                    <h2> Conclusión </h2>
                                    {data.Conclusion.map((item) => (
                                        <table class="styTable" key={item.fecha}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Fecha </td>
                                                    <td class="styTd"> {item.fecha} </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Sentido </td>
                                                    <td class="styTd"> { item.sentido } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> TPC </td>
                                                    <td class="styTd"> { item.tpc } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Acuerdo </td>
                                                    <td class="styTd"> { item.beneficio } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Beneficio </td>
                                                    <td class="styTd"> { item.beneficio } </td>
                                                </tr>
                                                {docApi}
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>

                            let varObjObservaciones = Object.keys(data.Observaciones).length === 0 ? '' :
                                <Fragment>
                                    <h2> Observaciones </h2>
                                    {data.Observaciones.map((item) => (
                                        <table class="styTable" key={item.descripcion}>
                                            <tbody>
                                                <tr>
                                                    <td class="styTd styTd40P"> Descripción  </td>
                                                    <td class="styTd"> { item.descripcion } </td>
                                                </tr>
                                                <tr>
                                                    <td class="styTd styTd40P"> Proceso </td>
                                                    <td class="styTd"> { item.proceso } </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    ))}
                                </Fragment>

                            if(Object.keys(data.Solicitud).length === 0) {
                                return(
                                    <p>No se encontro el expediente</p>   
                                )
                            } else { 
                                return(
                                    <Fragment>
                                        {varObjSolicitud}
                                        {varObjContrato}
                                        {varObjConvenio_Modificatorio}
                                        {varObjComplemento}
                                        {varObjTurnar_Director}
                                        {varObjTurnar_Conciliador}
                                        {varObjAudiencia_Acuerdo}
                                        {varObjConclusion}
                                        {varObjObservaciones}
                                    </Fragment>
                                )
                            }	
                            }}
                        </Query>
                        
                    </div>
                </div>
            </Fragment>
            
        );
    }
}

export default withRouter(FichaTecnica);
