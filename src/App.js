import React from 'react';
import { Select, Input, Button } from 'antd';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

import './App.css';
import 'antd/dist/antd.css';

import { deposits } from './depcalc.json';

const { Option } = Select;
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      code: undefined,
      period: undefined,
      minPeriod: undefined,
      selectedParam: undefined,
      summ: undefined,
      minSumm: undefined,
      rate: undefined,
      options: undefined,
      income: undefined,
    }
  }

  onChangeCode = (value) => {
    const options = deposits.find((item) => item.code === value)
    options.param.sort((a,b) => a.period_from - b.period_from)

    const minPeriod = options.param.map((item) => item.period_from)[0]

    this.setState({
      code: value, 
      period: undefined,
      minPeriod, 
      selectedParam: undefined,
      summ: undefined,
      minSumm: undefined,
      rate: undefined,
      options,
      income: undefined,
    })
  }

  onChangePeriod = (event) => {
    let period = parseInt(event.target.value.trim())
    let minSumm = undefined
    let rate = undefined
    let selectedParam = undefined

    if (isNaN(period)) 
      period = undefined
    else{
      const params = this.state.options.param
      selectedParam = params.find((item, index) => 
        period >= item.period_from && (!params[index+1] || period < params[index+1].period_from)
      )

      if(selectedParam) {
        minSumm = selectedParam.summs_and_rate[0].summ_from
        rate = selectedParam.summs_and_rate[0].rate
      }
    }

    this.setState({
      period, 
      selectedParam,
      summ: undefined,
      minSumm,
      rate,
      income: undefined,
    })
  }

  onChangeSumm = (event) => {
    let summ = parseInt(event.target.value.trim())
    let {rate, period, selectedParam} = this.state
    let income = undefined

    if(isNaN(summ)) {
      summ = undefined
    }
    else if(selectedParam){
      const summsAndRate = selectedParam.summs_and_rate
      let selectedSumAndRate = summsAndRate.find((item, index) => 
        summ >= item.summ_from && (!summsAndRate[index+1] || summ < summsAndRate[index+1].summ_from)
      )

      if(selectedSumAndRate) {
        rate = selectedSumAndRate.rate
        income = (summ*rate/100*period/365).toFixed(2)
      }
    }

    this.setState({
      summ,
      rate,
      income,
    })
  }

  onSave = () => {
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: 40,
      pageOrientation: 'portrait',
      content: [
        { 
          text: 'Депозитный калькулятор', 
          fontSize: 20, 
          margin: [0, 0, 0, 30] 
        },{ 
          text: [
            'Тип вклада: ',
            { 
              text: this.state.options.name, 
              bold: true 
            },
            '.',
          ], 
          margin: [0, 0, 0, 10]
        },{ 
          text: [
            'Период: ',
            { 
              text: this.state.period, 
              bold: true 
            },
            ' дней.',
          ], 
          margin: [0, 0, 0, 10]
        }, {
          text: [
            'Сумма: ',
            { 
              text: this.state.summ, 
              bold: true 
            },
            ' рублей.',
          ], 
          margin: [0, 0, 0, 20]
        }, {
          text: [
            'Процентная ставка: ',
            { 
              text: this.state.rate, 
              bold: true 
            },
            '%.',
          ], 
          margin: [0, 0, 0, 10]
        }, { 
          text: [
            'Доход: ',
            { 
              text: this.state.income, 
              bold: true 
            },
            ' рублей.',
          ]
        }
      ]
    }

    pdfMake.createPdf(docDefinition).open();
  }

  render() {
    return (
      <div className="App">
        <div className="content">
          <h1>Депозитный калькулятор</h1>
          <div className="form">
            <div className="form-input">
              <div className="form-input-field">
                <Select 
                  className="form-input-field" 
                  onChange={this.onChangeCode} 
                  placeholder="Выберите тип вклада"
                >
                  {deposits.map((item, index) => (
                    <Option key={index} value={item.code}>{item.name}</Option>
                  ))}
                </Select>
              </div>

              <div className="form-input-field">
                <Input  
                  placeholder="Укажите количество дней вклада" 
                  onChange={this.onChangePeriod}
                  disabled={!this.state.code}
                  value={this.state.period}
                />
                <div className="form-input-field-comment">
                  Минимальное количество дней вклада: {this.state.minPeriod}
                </div>
              </div>

              <div className="form-input-field">
                <Input 
                  placeholder="Укажите сумму вклада" 
                  onChange={this.onChangeSumm}
                  disabled={!this.state.period || this.state.period < this.state.minPeriod}
                  value={this.state.summ}
                />
                <div className="form-input-field-comment">
                  Минимальная сумма вклада: {this.state.minSumm} рублей
                </div>
              </div>
            </div>

            <div className="form-output"> 
              <div className="form-output-item">
                <div className="form-output-item-label">Процентная ставка: </div>
                <div className="form-output-item-value">
                  {this.state.period >= this.state.minPeriod && `${this.state.rate}%`}
                </div>
              </div> 
              
              <div className="form-output-item">
                <div className="form-output-item-label">Доход: </div>
                <div className="form-output-item-value">
                  {this.state.summ >= this.state.minSumm && `${this.state.income} рублей`}
                </div>
              </div>

              {this.state.income && <Button 
                  type="primary"
                  onClick={this.onSave}
                >
                  Сохранить как PDF файл
                </Button>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}
