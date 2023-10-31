import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import { Button } from '@mui/material';
import Generic from './Generic';
import View3d, { rgb2color } from './Component/View3d';

import big from './lib/big.min.txt';
import glMatrix from './lib/gl-matrix-min.txt';
import jsZip from './lib/jszip.min.txt';
import core from './lib/core.min.txt';
import geom from './lib/geom.min.txt';
import stroke from './lib/stroke.min.txt';
import batik from './lib/batik-svgpathparser.min.txt';
import jsXmlSaxParser from './lib/jsXmlSaxParser.min.txt';
import triangulator from './lib/triangulator.min.txt';
import viewModel from './lib/viewmodel.min.txt';
import viewHome from './lib/viewhome.min.txt';
import SweetHome3dDialog from './Component/SweetHome3dDialog';

function loadScript(url, onload) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.onload = () => {
            onload();
            resolve();
        };
        script.src = url;
        script.type = 'text/javascript';

        document.getElementsByTagName('HEAD')[0].appendChild(script);
    });
}

const styles = () => ({

});

class SweetHome3d extends Generic {
    canvasRef = React.createRef();

    constructor(props) {
        super(props);
        this.state.showDialog = false;
        this.state.scriptsLoaded = [
            { file: big, loaded: false },
            { file: glMatrix, loaded: false },
            { file: jsZip, loaded: false },
            { file: core, loaded: false },
            { file: geom, loaded: false },
            { file: stroke, loaded: false },
            { file: batik, loaded: false },
            { file: jsXmlSaxParser, loaded: false },
            { file: triangulator, loaded: false },
            { file: viewModel, loaded: false },
            { file: viewHome, loaded: false },
        ];
        this.state.subscriptions = [];
    }

    static getWidgetInfo() {
        return {
            id: 'tplMaterial2SweetHome3d',
            visSet: 'vis-2-widgets-sweethome3d',

            visSetLabel: 'set_label', // Label of this widget set
            visSetColor: '#0783ff', // Color of this widget set

            visWidgetLabel: 'sweet_home_3d',  // Label of widget
            visName: 'Sweet home 3d',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'noCard',
                            label: 'without_card',
                            type: 'checkbox',
                        },
                        {
                            name: 'widgetTitle',
                            label: 'name',
                            hidden: '!!data.noCard',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: '100%',
                height: 120,
                position: 'relative',
            },
            visPrev: 'widgets/vis-2-widgets-material/img/prev_actual.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo() {
        return SweetHome3d.getWidgetInfo();
    }

    onState = (id, state) => {
        console.log(id, state);
        if (this.state.hpc && this.state.hpc.getHome()) {
            this.state.rxData.settings.items.forEach(item => {
                if (item.oid1 === id) {
                    const homeItems = this.state.hpc.getHome().getHomeObjects();
                    const homeItem = homeItems[item.id];
                    if (homeItem) {
                        if (item.oid1type === 'show') {
                            homeItem.visible = state.val;
                            const component3D = this.state.hpc.getComponent3D();
                            component3D.updateObjects([homeItem]);
                        }
                        if (item.oid1type === 'color') {
                            homeItem.object3D.userData.color = state.val ? rgb2color(0, 255, 0) : homeItem.originalColor;
                            const component3D = this.state.hpc.getComponent3D();
                            component3D.updateObjects([homeItem]);
                        }
                    }
                }
                if (item.oid2 === id) {
                    console.log(item);
                }
            });
        }
    };

    async propertiesUpdate() {
        this.state.subscriptions.forEach(subscription => this.props.context.socket.unsubscribeState(subscription));
        this.setState({ subscriptions: [] });
        this.state.rxData.settings.items.forEach(item => {
            [1, 2].forEach(i => {
                const oid = item[`oid${i}`];
                if (oid && !this.state.subscriptions.includes(oid)) {
                    this.props.context.socket.subscribeState(oid, this.onState);
                    this.props.context.socket.getState(oid).then(state => {
                        this.onState(oid, state);
                    });
                    this.setState(state => {
                        state.subscriptions.push(oid);
                        return state;
                    });
                }
            });
        });
    }

    async componentDidMount() {
        super.componentDidMount();
        for (const i in this.state.scriptsLoaded) {
            const script = this.state.scriptsLoaded[i];
            if (!script.loaded) {
                await loadScript(script.file, () => {
                    this.setState(state => {
                        state.scriptsLoaded[i].loaded = true;
                        return state;
                    });
                });
            }
        }
        await this.propertiesUpdate();
    }

    componentWillUnmount() {
        super.componentWillUnmount();
    }

    async onRxDataChanged() {
        await this.propertiesUpdate();
    }

    componentDidUpdate() {

    }

    renderDialog() {
        return <SweetHome3dDialog
            open={this.state.showDialog}
            onClose={() => this.setState({ showDialog: false })}
            settings={this.state.rxData.settings}
            onChange={data => {
                this.props.onChangeSettings(data);
                setTimeout(() => this.propertiesUpdate(), 1000);
            }}
        />;
    }

    onItemClick = (item, component3D, hpc) => {
        // const color = item.object3D.userData.color;
        // item.object3D.userData.color = rgb2color(0, 255, 0);
        // component3D.updateObjects([item]);

        // item.visible = !item.visible;

        if (item.doorOrWindow) {
            if (!item.originalAngle) {
                item.originalAngle = item.angle;
            }
            if (item.angle === item.originalAngle) {
                item.angle += 10;
            } else {
                item.angle = item.originalAngle;
            }
        }

        const index = hpc.getHome().getHomeObjects().findIndex(_item => _item.id === item.id);
        this.state.rxData.settings.items.filter(_item => _item.id === index).forEach(_item => {
            if (_item.oid2) {
                if (_item.oid2type === 'state') {
                    this.props.context.socket.getState(_item.oid2).then(state => {
                        this.props.context.socket.setState(_item.oid2, !state.val);
                    });
                }
            }
        });

        // setTimeout(() => {
        //     item.object3D.userData.color = color;
        //     component3D.updateObjects([item]);
        // }, 300);
    };

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        if (!this.state.scriptsLoaded.every(script => script.loaded)) {
            return null;
        }

        const content = <>
            {this.state.showDialog ? null : <View3d
                onClick={this.onItemClick}
                HpcCallback={_hpc => {
                    this.setState({ hpc: _hpc });
                }}
                onLoad={() => {
                    this.state.subscriptions.forEach(oid => {
                        this.props.context.socket.getState(oid).then(state => {
                            this.onState(oid, state);
                        });
                    });
                }}
            />}
            {this.renderDialog()}
            <Button
                variant="contained"
                onClick={() => this.setState({ showDialog: true })}
            >
Open dialog
            </Button>
        </>;

        return this.wrapContent(
            content,
        );
    }
}

SweetHome3d.propTypes = {
    systemConfig: PropTypes.object,
    socket: PropTypes.object,
    themeType: PropTypes.string,
    style: PropTypes.object,
    data: PropTypes.object,
};

export default withStyles(styles)(SweetHome3d);
