import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';

export default React.createClass({
  mixins: [PureRenderMixin],

  getPair() {
    return this.props.pair || [];
  },
  isDisabled() {
    return !!this.props.hasVoted;
  },
  hasVotedFor(entry) {
    return this.props.hasVoted === entry;
  },
  submitVote(entry) {
    this.props.vote(entry)
  },
  render() {
    return <div className="voting">
      {this.getPair().map(entry =>
        <button key={entry}
                disabled={this.isDisabled()}
                onClick={this.submitVote.bind(this, entry)}>
          <h1>{entry}</h1>
          {this.hasVotedFor(entry) ?
            <div className="label">Voted</div> :
            null }
        </button>
      )}
    </div>;
  }
});